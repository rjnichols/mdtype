#set page(
  header: grid(
    columns: (1fr, 1fr, 1fr),
    align: (left, center, right),
    [Company Name],
    [Quarterly Report],
    [#datetime.today().display("[year]-[month]-[day]")]
  ),
  footer: grid(
    columns: (1fr, 1fr, 1fr),
    align: (left, center, right),
    [Confidential],
    context [Page #counter(page).display() of #counter(page).final().last()],
    [© 2025]
  )
)

= Executive Summary

This document demonstrates the header and footer functionality in mdtype. The frontmatter at the top of this file defines custom headers and footers that will appear on every page.

== Features Demonstrated

This example shows:

- *Header Left*: Static text ("Company Name")
- *Header Center*: Static text ("Quarterly Report")
- *Header Right*: Dynamic date using `{date:YYYY-MM-DD}` format
- *Footer Left*: Static text ("Confidential")
- *Footer Center*: Page numbers using `{page}` and `{total-pages}` placeholders
- *Footer Right*: Copyright notice

== Available Placeholders

You can use these placeholders in your header and footer configuration:

=== Page Numbers

- `{page}` - Current page number
- `{total-pages}` - Total number of pages

=== Dates

- `{date}` - Current date in default format (YYYY-MM-DD)
- `{date:YYYY-MM-DD}` - Custom date format
- `{date:DD/MM/YYYY}` - Another format example

=== Logos (if you have a logo file)

- `{logo:path/to/logo.png}` - Embeds a small logo image

== Content Example

=== Project Status

#figure(
  image("diagrams/mermaid-0.png", width: 80%),
)

=== Performance Metrics

#figure(
  table(
    columns: 5,
    [*Metric*],
    [*Q1*],
    [*Q2*],
    [*Q3*],
    [*Q4*],
    [Revenue],
    [\$1.2M],
    [\$1.5M],
    [\$1.8M],
    [\$2.1M],
    [Users],
    [10K],
    [15K],
    [22K],
    [30K],
    [Uptime],
    [99.9%],
    [99.95%],
    [99.99%],
    [99.99%],
  )
)

=== Mathematical Analysis

The growth rate formula:

$ g = (Q_4 - Q_1) / Q_1 times 100% $

== Conclusion

This example demonstrates how to use YAML frontmatter to configure headers and footers in your Typst documents generated from Markdown.

The headers and footers will appear on every page of the compiled PDF, making it easy to add professional formatting to your documents.

