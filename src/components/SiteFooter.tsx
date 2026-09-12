export default function SiteFooter() {
  return <footer className="site-footer">
    <p>OneNote System is free, open-source software released under the MIT License.</p>
    <nav aria-label="Footer navigation">
      <a href="mailto:me@erinskidds.com">Email support</a>
      <a href="https://github.com/DudeThatsErin/onenote-system/issues" target="_blank" rel="noreferrer">GitHub support</a>
      <a href="https://github.com/DudeThatsErin/onenote-system" target="_blank" rel="noreferrer">Source code</a>
      <a href="https://www.npmjs.com/package/onenotesystem" target="_blank" rel="noreferrer">Terminal client on npm</a>
      <a href="https://learn.microsoft.com/en-us/graph/integrate-with-onenote" target="_blank" rel="noreferrer">Microsoft OneNote API</a>
    </nav>
  </footer>;
}
