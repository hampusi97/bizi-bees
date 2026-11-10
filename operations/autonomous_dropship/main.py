"""
Main CLI and Entry Point for Bizibees Autonomous Dropship Bot.
Provides rich interactive CLI commands to run pipelines, start the cron scheduler,
inspect candidate queues, and manage catalog lifecycle.
"""

import asyncio
import logging
from typing import Optional
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import typer
from config.settings import Settings, get_settings
from database.models import CandidateStatus
from database.store import DatabaseStore
from scheduler.cron_orchestrator import CronOrchestrator

app = typer.Typer(
    help="🐝 Bizibees Autonomous Dropshipping & Multi-Channel Catalog Bot",
    rich_markup_mode="rich",
)
console = Console()


def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


@app.callback()
def main(
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable debug logging"),
):
    """Global startup callback."""
    log_level = "DEBUG" if verbose else get_settings().log_level
    configure_logging(log_level)


@app.command()
def run_pipeline():
    """
    Execute the complete 5-stage autonomous dropship pipeline immediately.
    Curls trends -> Vets economics -> Writes creatives -> Uploads to Shopify -> Briefs via Webhook.
    """
    settings = get_settings()
    console.print(Panel.fit(
        f"[bold gold1]🐝 Bizibees Autonomous Dropship Pipeline[/bold gold1]\n"
        f"Shop Domain: [cyan]{settings.shopify_shop_domain}[/cyan]\n"
        f"Mode: [{'red]SAFE MODE (DRAFT)' if settings.is_safe_mode else 'green]AUTOPILOT (ACTIVE)'}[/]\n"
        f"Target Channels: [blue]{settings.enabled_sales_channels}[/blue]",
        border_style="gold1",
    ))

    async def _execute():
        orchestrator = CronOrchestrator(settings)
        return await orchestrator.run_full_pipeline()

    with console.status("[bold green]Executing full autonomous cycle...", spinner="dots"):
        results = asyncio.run(_execute())

    table = Table(title="Autonomous Pipeline Execution Summary", border_style="green")
    table.add_column("Stage / Metric", style="cyan", no_wrap=True)
    table.add_column("Value / Count", style="bold white")
    table.add_column("Details", style="dim")

    table.add_row("Scouted Candidates", str(results["scouted_count"]), "TikTok + Meta + Feeds (Score >= 80)")
    table.add_row("Vetted Approved", str(results["vetted_count"]), "Passed 3x Margin & 3-7d US SLA & Compliance")
    table.add_row("Creatives Generated", str(results["creatives_count"]), "OS 2.0 HTML + 3-Hook Video Ad Scripts")
    table.add_row("Catalog Ingested", str(results["launched_count"]), "Shopify GraphQL Upload + Inventory Sync")
    table.add_row("Catalog Pruned", str(results["pruned_count"]), "Underperforming products drafted (>21d, <1.2% CTR)")
    table.add_row("Executive Briefing", "Dispatched" if results["briefing_sent"] else "Skipped / Failed", "Discord / Telegram / Console")

    console.print(table)

    if results["launched_products"]:
        console.print("\n[bold gold1]🚀 Newly Launched Products:[/bold gold1]")
        for p in results["launched_products"]:
            console.print(f"  • [bold]{p.shopify_handle}[/bold] -> [link={p.direct_shopify_url}]{p.direct_shopify_url}[/link] (${p.retail_price:.2f})")


@app.command()
def start_cron():
    """
    Start the background 24/7 daemon operating the strict UTC cron schedule:
    02:00 TrendScout | 03:00 EconVetter | 04:00 CreativeDirector | 05:00 CatalogJanitor | 06:00 Briefing.
    """
    settings = get_settings()
    console.print(Panel(
        f"[bold green]Starting Autonomous 24/7 Dropship Cron Daemon[/bold green]\n\n"
        f"Schedule Configuration (UTC):\n"
        f"  • [cyan]02:00 AM UTC[/cyan]: Module A (TrendScout) Crawl\n"
        f"  • [cyan]03:00 AM UTC[/cyan]: Module B (EconVetter) Margin & SLA Screening\n"
        f"  • [cyan]04:00 AM UTC[/cyan]: Module C (CreativeDirector) Copy & Video Scripts\n"
        f"  • [cyan]05:00 AM UTC[/cyan]: Module D (CatalogJanitor) GraphQL Launch & Prune\n"
        f"  • [cyan]06:00 AM UTC[/cyan]: Executive Briefing Dispatch (Discord/Telegram)\n\n"
        f"Autopilot State: [{'yellow]SAFE MODE (DRAFT)[/yellow]' if settings.is_safe_mode else '[green]AUTOPILOT (ACTIVE)[/green]'}",
        border_style="green",
    ))

    async def _loop():
        orchestrator = CronOrchestrator(settings)
        orchestrator.start_cron_scheduler()
        console.print("[dim]Daemon running. Press Ctrl+C to terminate.[/dim]")
        while True:
            await asyncio.sleep(3600)

    try:
        asyncio.run(_loop())
    except (KeyboardInterrupt, SystemExit):
        console.print("\n[yellow]Daemon stopped gracefully.[/yellow]")


@app.command()
def run_scout():
    """Run Module A: TrendScout only."""
    settings = get_settings()
    orchestrator = CronOrchestrator(settings)
    console.print("[cyan]Running Module A: TrendScout...[/cyan]")
    candidates = asyncio.run(orchestrator.trend_scout.run())
    console.print(f"[green]Qualified {len(candidates)} candidates scoring >= {settings.trend_score_min_threshold}.[/green]")


@app.command()
def run_vetter():
    """Run Module B: EconVetter only."""
    settings = get_settings()
    orchestrator = CronOrchestrator(settings)
    console.print("[cyan]Running Module B: EconVetter...[/cyan]")
    approved = asyncio.run(orchestrator.econ_vetter.run())
    console.print(f"[green]Approved {len(approved)} candidates meeting 3x margin and domestic SLA.[/green]")


@app.command()
def run_creative():
    """Run Module C: CreativeDirector only."""
    settings = get_settings()
    orchestrator = CronOrchestrator(settings)
    console.print("[cyan]Running Module C: CreativeDirector...[/cyan]")
    assets = asyncio.run(orchestrator.creative_director.run())
    console.print(f"[green]Generated {len(assets)} creative asset bundles.[/green]")


@app.command()
def run_janitor(
    prune_only: bool = typer.Option(False, "--prune-only", help="Run only the weekly prune engine"),
):
    """Run Module D: CatalogJanitor GraphQL launch and/or prune audit."""
    settings = get_settings()
    orchestrator = CronOrchestrator(settings)
    
    async def _exec():
        if prune_only:
            pruned = await orchestrator.catalog_janitor.run_audit_and_prune()
            return [], pruned
        else:
            launched = await orchestrator.catalog_janitor.run_add_and_sync()
            pruned = await orchestrator.catalog_janitor.run_audit_and_prune()
            return launched, pruned

    launched, pruned = asyncio.run(_exec())
    console.print(f"[green]CatalogJanitor completed: {len(launched)} launched, {len(pruned)} pruned to DRAFT.[/green]")


@app.command()
def status():
    """Display store settings, candidate queue statistics, and catalog health."""
    settings = get_settings()
    store = DatabaseStore(settings.database_path)

    all_candidates = []
    for st in CandidateStatus:
        all_candidates.extend(store.get_candidates_by_status(st))

    active_prods = store.list_active_catalog_products()
    all_prods = store.list_all_catalog_products()

    console.print(Panel(
        f"[bold gold1]🐝 Bizibees Store Automation Status[/bold gold1]\n"
        f"Domain: [cyan]{settings.shopify_shop_domain}[/cyan]\n"
        f"Live API Configured: [{'green]YES' if settings.is_live_shopify_configured else 'yellow]NO (Simulated Dry-Run Sandbox)'}[/]\n"
        f"Autopilot Safe Mode: [{'yellow]ACTIVE (DRAFT staging)' if settings.is_safe_mode else 'green]OFF (Instant LIVE publish)'}[/]\n"
        f"Total Tracked Candidates: [bold white]{len(all_candidates)}[/bold white]\n"
        f"Catalog Products: [bold white]{len(all_prods)}[/bold white] ([green]{len(active_prods)} active[/green])\n"
        f"Database File: [dim]{settings.database_path}[/dim]",
        border_style="gold1",
    ))


if __name__ == "__main__":
    app()
