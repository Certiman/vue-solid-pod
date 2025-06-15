# Solid Pod Process

## Short-term objectives remaining

The app should be able to handle the reporting tasks, be it through generic tasks `/process/{Process}/report_{report_scope}` or even by providing a separate application path like `/reports/{Process}/{report_scope}`. These reports will always require the regeneration (using SPARQL CONSTRUCT) of the instances of some `ex:Report`-class, which itself can be described as a first series of steps. The first step, when launching the reports task inside of the scope of a process, may ask the user what `/data/{Process}`-instances are to be included in the report. But also other sources may need to be included in the report. 

A further complication is the fact that some reports should be preceded by a SHACL-validation run. In that case, the SHACL to run is to be recorded in the first step, and the validation run created. From that SHACL-based source, together with other data sources, the report construction can take place.

Lastly, reports need a presentation, in which the literals of the CONSTRUCTED triples are located inside of a human-readable text.

## Requirements from these objectives

- [ ] Define an application path to launch the steps in order to create a report
- [ ] The user must have created a list of data sources in the app elsewhere, except for the data in the scope of the Process for which he launches the reports generation. These sources must be selected first.
- [ ] If the next step contains `dcterms:conformsTo` it can be interpreted as a preceding SHACL validation file to be executed beforehand on the data sources selected by the user. Progress on the validation must be made visible.
- [ ] The report construction must also be linked to a report step. Progress must be made visible.
- [ ] The report construction somehow must be able to retrieve the necessary sources. This could require the linking of a property as used in the report to the source.

Example of a report generation step:

```TTL
# Let us fully reuse the Task/Step engine
</reports/MyProcess/MyFirstReport> a dul:Task ;
   dct:description "This report is my first" ;
   rdf:first </reports/MyProcess/MyFirstReport#0> .

</reports/MyProcess/MyFirstReport#0> a dul:Action ;
   dct:description "Enter some general info as in the report presentation"
   dct:conformsTo </reports/MyProcess/report_form_1.shacl> ; # the form to collect general info ;
   era:selectedDataClass era:VehicleTypeAuthorisationApplication ; # the targetClass of the next step SHACL. It allows selection of ONE instance.
   schema:version 1 ;
   rdf:next </reports/MyProcess/MyFirstReport#1> .

</reports/MyProcess/MyFirstReport#1> a dul:Action ;
   dct:description "Running SHACL Validation on data of class {era:selectedDataClass}..." ;
   dct:conformsTo </process/MyProcess/validation1.shacl> ; # the SHACL checking the content of the data INSTANCE (and all linked therein) ;
   schema:version 1 ;
   rdf:next </reports/MyProcess/MyFirstReport#2> .

</reports/MyProcess/MyFirstReport#12> a dul:Action ;
   dct:description "Constructing assessment report 'Completeness Check'" ;
   dct:conformsTo </reports/MyProcess/construct_report_1.shacl> ; # the CONSTRUCT to run from the SHACL validation report, the original instance and the general data collected in step 0;
```

## Modifications needed in current codebase

- [ ] We must allow for properties of steps, tasks to be configurable, and not hard-coded. Some props are needing a change
- [ ] We must provide tests on the internal operations of the codebase.
- [ ] We must move code from components to reusable classes and assure test compliance.
- [ ] We must allow the user to create a labeled collection of data sources, like ERADIS+, ERATV+, other than his own data.
- [ ] We must allow for a step to be `async - await` and display the waiting state/progress.
- [ ] We must allow SPARQL CONSTRUCT
- [ ] We must allow SHACL validation
