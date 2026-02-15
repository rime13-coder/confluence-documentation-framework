"""
Confluence Documentation Importer

Reads markdown templates from the templates/ directory and creates
a full page hierarchy in Confluence Cloud via the REST API.

Usage:
    pip install -r scripts/requirements.txt
    python scripts/import_to_confluence.py

    # Dry run (preview without creating pages):
    python scripts/import_to_confluence.py --dry-run

    # Target a specific section only:
    python scripts/import_to_confluence.py --section 01-project-overview
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import markdown
import requests
import yaml


# ── Page hierarchy definition ────────────────────────────────────────────────
# Maps folder names to section titles and their child pages (in order).
# Each child maps a filename (without .md) to its Confluence page title.

PAGE_HIERARCHY = {
    "01-project-overview": {
        "title": "01 - Project Overview",
        "pages": {
            "project-charter": "Project Charter",
            "stakeholders-raci": "Stakeholders & RACI Matrix",
            "project-glossary": "Project Glossary",
        },
    },
    "02-solution-architecture": {
        "title": "02 - Solution Architecture",
        "pages": {
            "architecture-overview-hld": "Architecture Overview (HLD)",
            "low-level-design": "Low-Level Design (LLD)",
            "data-architecture": "Data Architecture",
            "integration-architecture": "Integration Architecture",
            "adr-template": "Architecture Decision Records (ADRs)",
        },
    },
    "03-security": {
        "title": "03 - Security",
        "pages": {
            "threat-model": "Threat Model",
            "security-review-checklist": "Security Review Checklist",
            "data-classification": "Data Classification",
        },
    },
    "04-approval-gates": {
        "title": "04 - Approval Gates",
        "pages": {
            "gate-1-design-review": "Gate 1 - Design Review",
            "gate-2-architecture-review-board": "Gate 2 - Architecture Review Board (ARB)",
            "gate-3-security-review": "Gate 3 - Security Review",
            "gate-4-change-advisory-board": "Gate 4 - Change Advisory Board (CAB)",
            "gate-5-go-no-go-checklist": "Gate 5 - Go / No-Go Checklist",
        },
    },
    "05-cicd-pipeline": {
        "title": "05 - CI/CD Pipeline",
        "pages": {
            "github-actions-overview": "GitHub Actions Overview",
            "build-pipeline": "Build Pipeline",
            "release-pipeline": "Release Pipeline",
            "environment-strategy": "Environment Strategy",
        },
    },
    "06-testing": {
        "title": "06 - Testing",
        "pages": {
            "test-strategy": "Test Strategy",
            "unit-testing": "Unit Testing",
            "integration-testing": "Integration Testing",
            "performance-testing": "Performance Testing",
            "security-testing": "Security Testing (SAST / DAST)",
            "uat-signoff": "UAT Sign-Off",
        },
    },
    "07-deployment-architecture": {
        "title": "07 - Deployment Architecture",
        "pages": {
            "azure-infrastructure-overview": "Azure Infrastructure Overview",
            "environment-architecture": "Environment Architecture (Dev / Staging / Prod)",
            "infrastructure-as-code": "Infrastructure as Code (IaC)",
            "networking-and-security": "Networking & Security",
            "disaster-recovery": "Disaster Recovery & Business Continuity",
        },
    },
    "08-operations": {
        "title": "08 - Operations",
        "pages": {
            "runbook": "Runbook",
            "monitoring-and-alerting": "Monitoring & Alerting",
            "incident-response-plan": "Incident Response Plan",
            "sla-slo-definitions": "SLA / SLO Definitions",
        },
    },
    "09-release-management": {
        "title": "09 - Release Management",
        "pages": {
            "release-notes-template": "Release Notes Template",
            "rollback-procedures": "Rollback Procedures",
            "post-deployment-verification": "Post-Deployment Verification",
        },
    },
}


class ConfluenceImporter:
    """Handles authentication and page creation in Confluence Cloud."""

    def __init__(self, base_url: str, email: str, api_token: str, space_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_url = f"{self.base_url}/wiki/rest/api"
        self.space_key = space_key
        self.auth = (email, api_token)
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        # Rate limiting: Confluence Cloud allows ~10 req/s
        self.request_delay = 0.3  # seconds between requests

    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make an authenticated request to Confluence API with rate limiting."""
        url = f"{self.api_url}/{endpoint}"
        time.sleep(self.request_delay)
        response = requests.request(
            method, url, auth=self.auth, headers=self.headers, **kwargs
        )
        if not response.ok:
            print(f"  ERROR [{response.status_code}]: {response.text[:300]}")
        return response

    def test_connection(self) -> bool:
        """Verify credentials and space access."""
        resp = self._request("GET", f"space/{self.space_key}")
        if resp.ok:
            space_name = resp.json().get("name", self.space_key)
            print(f"  Connected to space: {space_name}")
            return True
        print(f"  Failed to connect. Check your base_url, credentials, and space key.")
        return False

    def find_page(self, title: str) -> dict | None:
        """Find an existing page by title in the configured space."""
        params = {
            "spaceKey": self.space_key,
            "title": title,
            "type": "page",
        }
        resp = self._request("GET", "content", params=params)
        if resp.ok:
            results = resp.json().get("results", [])
            if results:
                return results[0]
        return None

    def create_page(
        self, title: str, body_html: str, parent_id: str | None = None
    ) -> dict | None:
        """Create a new page in Confluence. Returns the created page dict."""
        data = {
            "type": "page",
            "title": title,
            "space": {"key": self.space_key},
            "body": {
                "storage": {
                    "value": body_html,
                    "representation": "storage",
                }
            },
        }
        if parent_id:
            data["ancestors"] = [{"id": parent_id}]

        resp = self._request("POST", "content", json=data)
        if resp.ok:
            page = resp.json()
            return page
        return None

    def update_page(self, page_id: str, title: str, body_html: str, version: int) -> dict | None:
        """Update an existing page with new content."""
        data = {
            "type": "page",
            "title": title,
            "version": {"number": version + 1},
            "body": {
                "storage": {
                    "value": body_html,
                    "representation": "storage",
                }
            },
        }
        resp = self._request("PUT", f"content/{page_id}", json=data)
        if resp.ok:
            return resp.json()
        return None


def convert_markdown_to_confluence(md_content: str) -> str:
    """Convert markdown to Confluence storage format (XHTML).

    Handles tables, code blocks, headers, lists, and inline formatting.
    """
    # Convert using Python-Markdown with common extensions
    extensions = [
        "markdown.extensions.tables",
        "markdown.extensions.fenced_code",
        "markdown.extensions.codehilite",
        "markdown.extensions.toc",
        "markdown.extensions.nl2br",
        "markdown.extensions.sane_lists",
    ]
    extension_configs = {
        "markdown.extensions.codehilite": {
            "css_class": "code",
            "guess_lang": False,
        }
    }

    html = markdown.markdown(
        md_content,
        extensions=extensions,
        extension_configs=extension_configs,
    )

    # Post-process: wrap code blocks in Confluence macro format
    html = _wrap_code_blocks(html)

    # Post-process: convert HTML comment placeholders to Confluence info macros
    html = _convert_comments_to_info_macros(html)

    return html


def _wrap_code_blocks(html: str) -> str:
    """Convert <pre><code> blocks to Confluence code macros."""
    import re

    def replacer(match):
        lang_match = re.search(r'class="[^"]*language-(\w+)', match.group(0))
        lang = lang_match.group(1) if lang_match else "text"

        # Extract the code content (strip tags)
        code = re.sub(r"<[^>]+>", "", match.group(0))
        # Unescape HTML entities in code
        code = (
            code.replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&amp;", "&")
            .replace("&quot;", '"')
        )

        return (
            f'<ac:structured-macro ac:name="code">'
            f'<ac:parameter ac:name="language">{lang}</ac:parameter>'
            f"<ac:plain-text-body><![CDATA[{code}]]></ac:plain-text-body>"
            f"</ac:structured-macro>"
        )

    return re.sub(r"<pre><code[^>]*>.*?</code></pre>", replacer, html, flags=re.DOTALL)


def _convert_comments_to_info_macros(html: str) -> str:
    """Convert HTML comments like <!-- Insert diagram --> to Confluence info macros."""
    import re

    def replacer(match):
        comment = match.group(1).strip()
        return (
            f'<ac:structured-macro ac:name="info">'
            f"<ac:rich-text-body><p>{comment}</p></ac:rich-text-body>"
            f"</ac:structured-macro>"
        )

    return re.sub(r"<!--\s*(.*?)\s*-->", replacer, html, flags=re.DOTALL)


def load_config(config_path: str) -> dict:
    """Load and validate the configuration file (YAML or JSON)."""
    path = Path(config_path)
    if not path.exists():
        print(f"Config file not found: {config_path}")
        print("Copy scripts/config.yaml and fill in your Confluence details.")
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        if path.suffix == ".json":
            config = json.load(f)
        else:
            config = yaml.safe_load(f)

    # Validate required fields
    required = [
        ("confluence.base_url", config.get("confluence", {}).get("base_url")),
        ("confluence.email", config.get("confluence", {}).get("email")),
        ("confluence.api_token", config.get("confluence", {}).get("api_token")),
        ("space.key", config.get("space", {}).get("key")),
        ("project.name", config.get("project", {}).get("name")),
    ]

    missing = [name for name, val in required if not val or "YOUR_" in str(val)]
    if missing:
        print(f"Missing or placeholder values in config: {', '.join(missing)}")
        print("Edit scripts/config.yaml with your actual Confluence details.")
        sys.exit(1)

    return config


def run_import(config_path: str, dry_run: bool = False, section_filter: str = None, templates_dir: str = None):
    """Main import workflow."""
    config = load_config(config_path)

    confluence_cfg = config["confluence"]
    space_key = config["space"]["key"]
    project_name = config["project"]["name"]

    templates_dir = Path(templates_dir) if templates_dir else Path(__file__).parent.parent / "templates"
    if not templates_dir.exists():
        print(f"Templates directory not found: {templates_dir}")
        sys.exit(1)

    print("=" * 60)
    print("Confluence Documentation Importer")
    print("=" * 60)
    print(f"  Space:   {space_key}")
    print(f"  Project: {project_name}")
    print(f"  Mode:    {'DRY RUN' if dry_run else 'LIVE'}")
    if section_filter:
        print(f"  Filter:  {section_filter}")
    print("=" * 60)

    if not dry_run:
        importer = ConfluenceImporter(
            base_url=confluence_cfg["base_url"],
            email=confluence_cfg["email"],
            api_token=confluence_cfg["api_token"],
            space_key=space_key,
        )

        print("\nTesting connection...")
        if not importer.test_connection():
            sys.exit(1)

    # ── Step 1: Create (or find) the top-level project page ───────────────
    project_title = f"{project_name} - Documentation"
    print(f"\n[ROOT] {project_title}")

    root_id = None
    if not dry_run:
        existing = importer.find_page(project_title)
        if existing:
            root_id = existing["id"]
            print(f"  Found existing page (id: {root_id})")
        else:
            root_body = (
                "<h1>Project Documentation</h1>"
                f"<p>Documentation hub for <strong>{project_name}</strong>.</p>"
                "<p>Navigate to the child pages below for detailed documentation.</p>"
                '<ac:structured-macro ac:name="children">'
                '<ac:parameter ac:name="all">true</ac:parameter>'
                "</ac:structured-macro>"
            )
            page = importer.create_page(project_title, root_body)
            if page:
                root_id = page["id"]
                print(f"  Created (id: {root_id})")
            else:
                print("  FAILED to create root page. Aborting.")
                sys.exit(1)

    # ── Step 2: Create section pages and their children ───────────────────
    total_created = 0
    total_updated = 0
    total_skipped = 0

    for folder_name, section in PAGE_HIERARCHY.items():
        if section_filter and section_filter not in folder_name:
            continue

        section_title = f"{project_name} - {section['title']}"
        print(f"\n[SECTION] {section_title}")

        section_id = None
        if not dry_run:
            existing = importer.find_page(section_title)
            if existing:
                section_id = existing["id"]
                print(f"  Found existing section page (id: {section_id})")
            else:
                section_body = (
                    f"<h1>{section['title']}</h1>"
                    '<ac:structured-macro ac:name="children">'
                    '<ac:parameter ac:name="all">true</ac:parameter>'
                    "</ac:structured-macro>"
                )
                page = importer.create_page(section_title, section_body, parent_id=root_id)
                if page:
                    section_id = page["id"]
                    print(f"  Created (id: {section_id})")
                    total_created += 1
                else:
                    print(f"  FAILED to create section. Skipping children.")
                    continue

        # Create child pages
        for file_stem, page_title in section["pages"].items():
            full_title = f"{project_name} - {page_title}"
            md_path = templates_dir / folder_name / f"{file_stem}.md"

            if not md_path.exists():
                print(f"  [SKIP] {page_title} (file not found: {md_path.name})")
                total_skipped += 1
                continue

            md_content = md_path.read_text(encoding="utf-8")
            html_body = convert_markdown_to_confluence(md_content)

            if dry_run:
                print(f"  [DRY RUN] {full_title} ({len(html_body)} chars)")
                total_created += 1
                continue

            existing = importer.find_page(full_title)
            if existing:
                page_id = existing["id"]
                version = existing["version"]["number"]
                result = importer.update_page(page_id, full_title, html_body, version)
                if result:
                    print(f"  [UPDATED] {page_title} (v{version + 1})")
                    total_updated += 1
                else:
                    print(f"  [FAILED]  {page_title}")
            else:
                page = importer.create_page(full_title, html_body, parent_id=section_id)
                if page:
                    print(f"  [CREATED] {page_title} (id: {page['id']})")
                    total_created += 1
                else:
                    print(f"  [FAILED]  {page_title}")

    # ── Summary ───────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("Import Complete")
    print("=" * 60)
    print(f"  Created:  {total_created}")
    print(f"  Updated:  {total_updated}")
    print(f"  Skipped:  {total_skipped}")

    if not dry_run:
        space_url = f"{confluence_cfg['base_url']}/wiki/spaces/{space_key}"
        print(f"\n  View your space: {space_url}")
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Import documentation templates into Confluence Cloud"
    )
    parser.add_argument(
        "--config",
        default=os.path.join(os.path.dirname(__file__), "config.yaml"),
        help="Path to config.yaml (default: scripts/config.yaml)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be created without making API calls",
    )
    parser.add_argument(
        "--section",
        default=None,
        help="Only import a specific section (e.g., '01-project-overview')",
    )
    parser.add_argument(
        "--templates-dir",
        default=None,
        help="Path to templates directory (default: templates/ next to scripts/)",
    )
    args = parser.parse_args()

    run_import(
        config_path=args.config,
        dry_run=args.dry_run,
        section_filter=args.section,
        templates_dir=args.templates_dir,
    )
