"""Source-adapter layer for the normalized migration bundle.

Each adapter turns one source's export into the on-disk bundle documented in
``platform/scripts/BUNDLE_SCHEMA.md``, which the general importer
(``ezycourse_import.py``) consumes unchanged. EzyCourse is adapter #1; the
generic-CSV adapter and future Teachable/Thinkific adapters emit the same tree.

Public API::

    from adapters import Adapter, get_adapter
    from adapters.ezycourse import EzyCourseAdapter
    from adapters.csv_generic import CsvGenericAdapter

    adapter = get_adapter("csv_generic")
    adapter.to_bundle("my_csvs", "bundle_out")

Adapters are standalone stdlib Python and never import ``frappe``.
"""

from .base import (
    Adapter,
    copy_asset,
    safe_name,
    write_course,
    write_manifest,
    write_normalized,
)

__all__ = [
    "Adapter",
    "safe_name",
    "write_course",
    "write_normalized",
    "write_manifest",
    "copy_asset",
    "get_adapter",
    "ADAPTERS",
]

# Registry of adapter name -> "module:ClassName". Imported lazily so importing
# this package never drags in an adapter's optional deps.
ADAPTERS = {
    "ezycourse": "adapters.ezycourse:EzyCourseAdapter",
    "csv_generic": "adapters.csv_generic:CsvGenericAdapter",
}


def get_adapter(name: str) -> Adapter:
    """Instantiate a registered adapter by name (e.g. "ezycourse")."""
    import importlib

    try:
        target = ADAPTERS[name]
    except KeyError:
        raise KeyError(f"unknown adapter '{name}'; known: {sorted(ADAPTERS)}")
    module_name, cls_name = target.split(":")
    module = importlib.import_module(module_name)
    return getattr(module, cls_name)()
