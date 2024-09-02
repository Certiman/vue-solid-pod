# Source of the SHACL Form

The shape of the form MUST currently be present in the Solid POD as a non-RDF resource (uploaded file):

The URI of the [shape](https://storage.inrupt.com/{Pod_Identifier}/getting-started/formShapes/example_form.ttl).

The shape COULD be converted to a Solid RDF resource from pure RDF, using the `solid-client`-function `fromrdfjsdataset()` ([documentation](https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/rdfjs.html#fromrdfjsdataset)). Our application however does not support this approach yet.

## Components

- [ ] Component to show form in a certain mode (view|edit).
- [X] Component to show the title/description of a group of items (like book), and buttons to edit the title or delete the book.
- [ ] A modal allowing for the editing of a complex book.
