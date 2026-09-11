# Invoice architecture explainer

Open **sony-invoice-explainer.html** in a browser. It is self-contained and works offline: no server, installation, external libraries, or live SAP access required.

- **The architecture:** click components to explore their responsibilities; select integration alternatives A, B or C. Open **See inputs, actions & outputs** for more detail in a side drawer.
- **Follow an invoice:** choose the non-PO, PO or late-backup story. Use Continue, Back, Restart or the numbered steps.
- **Presenter notes:** reveal discussion cues and scenario assumptions.
- **Takeaway:** print the two-page summary or save it as PDF. A ready-made copy is included as **sony-invoice-takeaway.pdf**.
- **Follow the handoff:** the diagram shows what moves between components; changed case fields and newly arriving evidence are highlighted.
- **Reduce motion:** disable animations. The page also respects the operating system's reduced-motion preference.

The walkthroughs preserve the selected reuse approach: **A** shows tools executing permitted VIM actions; **B** adds an explicit AP handoff, with the user applying the proposal in VIM before processing continues. Both retain VIM business checks. B assumes usable intake and evidence access; the installed interfaces remain to be confirmed. **C** is an architecture alternative; its walkthrough button explicitly opens the A reuse example. All examples, human actions and outcomes are simulated. The full rationale and sources are in **architecture.md**.

Keep the files together if sharing the HTML with the architecture-document link. The HTML itself has no runtime file dependencies.
