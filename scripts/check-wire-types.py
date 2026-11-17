#!/usr/bin/env python3
"""Check every hand-written wire type against the backend's Pydantic schemas.

Three bugs in this repo were all the same mistake: a TS wire type reading a key the API does
not send. `occurred_at` read as `created_at` crashed the order detail page; `product_title`
read as `name` crashed the dashboard; `review_note` never existed at all. TypeScript cannot
catch these — the type *is* the assumption — and a live-payload check misses any field that
happens to be null or inside an empty array.

Run from the web repo with the backend checked out alongside it:

    python3 scripts/check-wire-types.py

Exits non-zero on a mismatch. Paths assume `../ODOS_MOBILE_BACKEND`.
"""
import sys

import ast, re, glob

BE, WEB = "../ODOS_MOBILE_BACKEND", "."

models = {}
for f in glob.glob(f"{BE}/app/schemas/*.py"):
    for node in ast.parse(open(f).read()).body:
        if isinstance(node, ast.ClassDef):
            fields = {}
            for stmt in node.body:
                if isinstance(stmt, ast.AnnAssign) and isinstance(stmt.target, ast.Name):
                    name = stmt.target.id
                    if name == "model_config":
                        continue
                    alias = None
                    if stmt.value is not None:
                        m = re.search(r'alias=["\'](\w+)["\']', ast.unparse(stmt.value))
                        if m: alias = m.group(1)
                    fields[alias or name] = True
            models[node.name] = fields

# Nested inline object literals are checked too — that is the gap that let the
# top_products mismatch (product_title vs name) reach the browser.
MAP = {
    "VendorOrderRead": "VendorOrderRead", "VendorOrderItemRead": "VendorOrderItemRead",
    "OrderStatusEventRead": "OrderStatusEventRead", "VendorProductRead": "VendorProductRead",
    "VendorDashboardRead": "VendorDashboardRead", "VendorAnalyticsRead": "VendorAnalyticsRead",
    "VendorCustomerRead": "VendorCustomerRead", "VendorApplicationRead": "VendorApplicationRead",
    "VendorStoreRead": "VendorStoreRead", "DeliverySettingsRead": "VendorDeliverySettingsRead",
    "SectionRead": "VendorStoreSectionRead", "NominationRead": "VendorFlashSaleNominationRead",
    "CampaignRead": "MerchandisingCampaignRead", "OptInRead": "AdminMerchandisingCampaignOptInRead",
    "VoucherRedemptionRead": "VendorVoucherRedemptionRead", "PromoOverviewRead": "PromoAnalyticsOverviewRead",
    "VendorVoucherRead": "VendorVoucherRead", "VendorReturnRead": "VendorReturnRequestRead",
    "VendorReviewRead": "VendorReviewRead", "VendorWalletRead": "VendorWalletRead",
    # Service marketplace. Added after `ServicePackageRead.title` was read as `name`, which is
    # the same mistake this script exists to catch.
    "CategoryRead": "ServiceCategoryRead", "SummaryRead": "ServiceSummaryRead",
    "ActionRead": "AssistantActionRead", "ProductRead": "AssistantProductRead",
    "StoreRead": "AssistantStoreRead", "MessageRead": "AssistantMessageRead",
    "StatusRead": "AssistantStatusResponse", "ChatRead": "AssistantChatResponse",
    "SessionRead": "AssistantSessionResponse",
}
# Inline nested literals: TS parent type -> (wire key, backend model)
NESTED = {
    ("VendorAnalyticsRead", "top_products"): "VendorTopProductRead",
    ("VendorAnalyticsRead", "daily_points"): "VendorAnalyticsDailyPoint",
    ("PromoOverviewRead", "channels"): "PromoAnalyticsChannelSummary",
    ("PromoOverviewRead", "top_performers"): "PromoAnalyticsEntityPerformance",
    ("DetailRead", "packages"): "ServicePackageRead",
    ("DetailRead", "addons"): "ServiceAddonRead",
    ("DetailRead", "images"): "ServiceImageRead",
}

src = {f: open(f).read() for f in glob.glob(f"{WEB}/services/*.ts")}

def find_type(name):
    """Body of a TS type alias, including intersections like `type X = Y & { ... }`."""
    for text in src.values():
        # Non-greedy to the first literal `};`. Nested arrays-of-objects end `}[];`, which this
        # deliberately does not match, so a multi-line type still closes at its own brace.
        m = re.search(rf"type {name} = (?:\w+\s*&\s*)?\{{(.*?)\}};", text, re.S)
        if m: return m.group(1)
    return None

problems, checked = 0, 0
for ts, be in sorted(MAP.items()):
    body = find_type(ts)
    if body is None or be not in models:
        print(f"SKIP {ts:24} (ts={body is not None} backend={be in models})"); continue
    flat = re.sub(r"\{[^{}]*\}", "", body)
    declared = set(re.findall(r"(\w+)\??:", flat))
    bogus = sorted(d for d in declared if d not in models[be])
    checked += 1
    if bogus:
        problems += 1; print(f"FAIL {ts:24} not in {be}: {bogus}")
    else:
        print(f"OK   {ts:24} {len(declared):2} keys -> {be}")

print("\n-- nested inline literals --")
for (parent, key), be in sorted(NESTED.items()):
    body = find_type(parent)
    if body is None: print(f"SKIP {parent}.{key}"); continue
    m = re.search(rf"{key}\??:\s*\{{(.*?)\}}", body, re.S)
    if not m: print(f"SKIP {parent}.{key} (no inline literal)"); continue
    declared = set(re.findall(r"(\w+)\??:", m.group(1)))
    bogus = sorted(d for d in declared if d not in models[be])
    checked += 1
    if bogus:
        problems += 1; print(f"FAIL {parent}.{key:16} not in {be}: {bogus}")
    else:
        print(f"OK   {parent}.{key:16} {len(declared)} keys -> {be}")

# Types this script cannot cover, so they are named rather than silently missing.
# `/home-feed/` builds plain dicts in app/services/home_feed_service.py with no Pydantic model,
# so HomeFeedRead / FeedSectionRead in services/feed.service.ts are verified against a live
# payload only. If that endpoint grows a schema, add it to MAP above.
UNCHECKED = [
    ("HomeFeedRead", "/home-feed/ returns a plain dict, no Pydantic model"),
    ("FeedSectionRead", "same - nested inside that dict"),
    ("WishlistItemRead", "app/schemas/wishlist.py uses str price fields; shape confirmed live"),
]
print("\n-- not statically checkable --")
for name, why in UNCHECKED:
    print(f"n/a  {name:24} {why}")

print(f"\nchecked {checked} -> {problems} mismatch(es)")
sys.exit(1 if problems else 0)
