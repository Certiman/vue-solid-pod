# Solid Pods as linked data based process providers and users

We tackle the challenge of having several distinct stakeholders, all needing to store confidential or public data, in common data schemas. We thus provide, in this Proof Of Concept, a solution through Solid Pods, where the processes and schemas are centralised at the Agency's Pod, and the data is stored in the Pod of the stakeholder who completely controls access to other WebId's as they see fit.

## Use case: Registers

The Agency is required - via the legislation non several so-called Registers - to manage data as provided by several stakeholders and has decided to define a common `era:` ontology in order to allow interoperability between processes in which this data is used. The current proof of concept allows stakeholders to run the data gathering and maintaining processes as a set of forms which are defined by the Agency on its own Solid Pod. The processes a certain stakeholder needs are made accessible to its WebId. As such, all stakeholders hve public access to read the process `/Organisation` and the several tasks therein, like `/add`, `/addSite`, `/addUnit`, and `/addPost`. In the Agency's Solid Pod, each task is stored as a Solid Dataset within the `/process/Organisation`-container:

- [ ] The general process is stored under Container `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/`;
- [ ] The tasks are stored as datasets:
  - [ ] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/add`
  - [ ] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/addSite`
  - [ ] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/addPost`
  - [ ] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/edit`
- [ ] The steps of the task are stored as Things in the dataset, and contain themselves the contents to visualise or manage of that step. All steps have a version, such that the user can choose between task versions.

## Contents of a step Thing

A Step will be of `rdf:type`: `http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#Action`.

For the example `/Organisation/add#uuid`, the step Things have the properties:

- `rdfs:comment`: not used.
- `http://purl.org/dc/elements/1.1/description` | `http://purl.org/dc/terms/description`: a long explanation of the step, always shown as intro before the form. Examples:
  - (/add) "Add your organisation's data, including sites where legally located and contact address."
  - (n/a) "Add a department, unit or other part of the organization that in itself is not a legal entity on its own. Will link an instance of org:OrganizationalUnit to the selected Organisation."
  - (/addSite) "Add a location in which an Organisation or Unit is taking residence. The site can be linked to the organisation or unit using the LinkSiteToOrganisation task."
  - (n/a) "Link a site to any organisation or unit. Available links are org:hasSite, org:hasPrimarySite (contact address) and org:hasRegisteredSite (legally registered address)."
- `rdfs:label`: the short title of each task
- `http://schema.org/version`: the version of the task this step belongs to.
- `http://purl.org/dc/terms/source` for the SHAPE of the form to show, which must be stored in a readable container of the process.