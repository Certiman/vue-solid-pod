# Solid Pods as linked data based process providers and users

We tackle the challenge of having several distinct stakeholders, all needing to store confidential or public data, in common data schemas. We thus provide, in this Proof Of Concept, a solution through Solid Pods, where the processes and schemas are centralised at the Agency's Pod, and the data is stored in the Pod of the stakeholder who completely controls access to other WebId's as they see fit.

## Use case: Registers

The Agency is required - via the legislation on several so-called Registers - to manage data as provided by several stakeholders and has decided to define a common `era:` ontology in order to allow interoperability between processes in which this data is used. The current proof of concept allows stakeholders to run the data gathering and maintaining processes as a set of forms which are defined by the Agency on its own Solid Pod. The users log into their own Pod and can access the processes as provided, be it because they are public, or because their WebId has been allowed access.

As a general example of a process which is always available, all stakeholders have public access to read the process `/Organisation` and the several tasks therein, like `/add`, `/addSite`, `/addUnit`, and `/addPost`. In the Agency's Solid Pod, each task is stored as a Solid Dataset within the `/process/Organisation`-container:

- [X] The general process is stored under Container `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/`;
- [X] The tasks are stored as datasets:
  - [X] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/add`
  - [ ] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/addSite` (foreseen)
  - [ ] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/addPost` (not yet foreseen)
  - [ ] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/addMember` (idem)
  - [ ] `https://storage.inrupt.com/{STORAGE_ID}/process/Organisation/edit` (foreseen)
- [ ] The steps of the task are stored as Things in the dataset, and contain themselves the contents to visualise or manage of that step.
- [ ] All steps have a version, such that the user can choose between task versions, and the process provider can add new versions of tasks on the fly.
- [ ] All task steps with a SHACL-Form will store the outcome into an UPDATED Dataset in the Pod of the process user (with a small set of triples added also at the Provider for search obkectives using `owl:sameAs`)

## Contents of a Task description Thing

An instance of `http://www.w3.org/ns/ldp#RDFSource` which is also a `dul:Task` holds the administrative data of the Task, like the Label (under `rdfs:comment`), and the person to contact for questions under `vcard:hasEmail`.

- [X] The steps are chained using `rdf:rest` within the step, and all first tasks (no matter their version) are present on the Tasks descriptor Thing [Example](https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/Organisation/add) under the property `rdf:first`.
- [ ] The rules to construct the URI of where the outcome must be stored is a property of a step with SHACL-Form.

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
- `rdf:rest` links the task step to the next one (unique in one version)
- If a Shape File is used, it must indicate where to store the resulting triples. More info below.

## Storage

Processes have at leat the following 3 objectives:

1. to collect data in RDF
2. to convert data in RDF into lists, reports, documents (for analysis and presentation)
3. to be findable by search action, as started from the Process Provider.

The data collected by tasks in the process `https://storage.inrupt.com/{STORAGE_ID}/process/:Process/`, will always be `https://storage.inrupt.com/{STORAGE_ID}/data/:Process/{taskStorageContainer/}{subject}#uuid`, whereby the `#uuid` is generated by SHACL form and the `taskStorageContainer` is determined/calculated by the Task Step in which it is stored.

Example:

- `/Organisations` store data in:
  - `/data/organisation/org#uuid` for (Formal)Organisation(alUnit);
  - `/data/organisation/site#uuid` for Sites;
  - `/data/organisation/post#uuid` for Posts;