# Routes

## Running a process task

This application maps its /process/:processname/:task/:step route to Solid Pod RDFResources describing the details of this step. When on that route, the task processor will analyse the contents and display:

- [ ] `http://www.w3.org/2000/01/rdf-schema#label` for the Title of the step
- [ ] `http://www.w3.org/2000/01/rdf-schema#comment` fo the introduction of the step.
- [ ] `http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML` for pure HTML-contents
- [ ] `http://purl.org/dc/elements/1.1/source` for the HTML5 form based on SHACL-FORM
- [ ] HTML5 list based on a query
- [ ] `http://schema.org/step` for the URL to the next step if different or triggerss a special function

- [X] /process/:processname/ [:task & :step = null] lists the tasks as found in a process.
- [ ] /process/ allows for a process to be added
  
## Reserved tasks

Some predefined :tasks are reserved however:

- [ ] /process/:processname/addTask shows a modal to add a task, which is a SolidDataset, like mybookList
- [ ] /process/:processname/search shows a form enabling to search instances created in the process
- [ ] /process/:processname/:task/addStep shows a form to add a task step, which is a Resource