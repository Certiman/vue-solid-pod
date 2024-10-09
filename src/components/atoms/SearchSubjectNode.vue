<script setup>
/**
 * Component ID: "SEARCH"
 * Function: Search component for ?s nodes, for reuse in SHACL FORM.
 * Definition:
 * Component creates SPARQL query, and runs it into triple store OR solid Pod:
 *      [ PREFIXES ]
 *      SELECT ?s WHERE {
 *          ?s
 *              a ${classURI} ;
 *              ${propURI} ?{literalValue}
 *      }.
 *
 * Examples:
 * - ERADIS+: will find all certificate ?s a vpa:DocumentedEvidence ; dct:identifier "<ERADIS ID>"
 * - ERALEX: will find all legislation ?s a vpa:Requirement ; rdfs:label "2018/868"
 *
 * SHACL FORM usage:
 * SF is not directly able to retrieve ?s nodes to serve as the object value of certain properties.
 * This complicates the use of SF with instances having a lot of IRIs as objects of certain props.
 *
 * THUS:
 * the ?s node hence should exists as drop-down values, using the setClassInstanceProvider( (c) => { // function generating the subjects and rdfs:comment selection values })
 * As described here: https://github.com/Certiman/shacl-form-skos/tree/main?tab=readme-ov-file#classInstanceProvider
 *
 */
import { ref } from 'vue'
import { getDefaultSession, fetch } from '@inrupt/solid-client-authn-browser'
import {
  getBoolean,
  getIri,
  getSolidDataset,
  getStringNoLocale,
  getStringNoLocaleAll,
  getStringWithLocaleAll,
  getThingAll,
  getUrl,
  getUrlAll
} from '@inrupt/solid-client'
import { QueryEngine } from '@comunica/query-sparql-solid'
import { RDFS, RDF, OWL, XSD } from '@inrupt/vocab-common-rdf'
import { ELI } from '@/vocabularies/ELI'

// Props
// const props = defineProps({ classURI: URL, propURI: URL, sourceURI: URL, canShowDetails: Boolean })
// test with:
const props = {
  classURI: 'https://w3id.org/vpa#Requirement',
  sourceURI:
    'https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/data/requirements/eralex',
  propURI: RDFS.label,
  canShowDetails: true
}

// UI vars
const literal = ref('2023/1695')
const literalType = ref('') // from [xsd:number, xsd:string, xsd:date]
const query = ref('')
const queryIsRunning = ref(false)
const bindingsTable = ref([])
const outputFormat = {
  BINDINGS: false,
  THINGS: true
}

const startStream = async () => {
  // Fails with the experimental Comunica engine, so use the internal solid search
  throw new Error('Comunica querying solid pods fails at the moment')
  queryIsRunning.value = true
  showDetails.value = true
  // Engine
  const session = getDefaultSession()

  const engineOptions = {
    lenient: true,
    //   '@comunica/actor-http-inrupt-solid-client-authn:session': session,
    fetch: session.fetch,
    //   sources: [props.sourceURI]
    //   sources: [session.info.webId].push(props.sourceURI)
    sources: [session.info.webId]
  }
  // launches the query and awaits the stream of results.
  // Stream conversion is still needed elsewhere
  const myEngine = new QueryEngine()
  if (literal.value.length == 0) return null

  //   query.value = `
  // PREFIX dc:   <http://purl.org/dc/elements/1.1/>
  // PREFIX ldp:  <http://www.w3.org/ns/ldp#>
  // PREFIX owl:  <http://www.w3.org/2002/07/owl#>
  // PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  // PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  // PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>

  // SELECT DISTINCT ?s WHERE {
  //     ?s  a <${props.classURI}> ;
  //         <${props.propURI}> "${literal.value}"^^${literalType.value || `<xsd:string>`}
  // }
  // LIMIT 10
  //     `
  query.value = `SELECT * WHERE {
      ?s ?p ?o
  } LIMIT 100`

  try {
    const context = engineOptions // might require some adaptations
    console.warn(`Streaming with context:`, context)

    const bindingsStream = await myEngine.queryBindings(query, context)
    bindingsStream.on('error', (err) => console.error(err))
    bindingsStream.on('end', (txt) => console.log(`Stream ended with message ${txt}.`))

    for await (const bindings of bindingsStream) {
      bindingsTable.value.push([bindings.get('s').value, bindings.get('s').termType])
    }
  } catch (error) {
    console.error(error)
  } finally {
    queryIsRunning.value = false
  }
}

const searchThings = async () => {
  queryIsRunning.value = true
  showDetails.value = true
  //use solidDS, http://www.w3.org/2000/01/rdf-schema#label
  try {
    console.log(
      `Fetching resources at ${props.sourceURI} (filter on ${props.propURI} == ${literal.value})...`
    )

    let dataset = await getSolidDataset(props.sourceURI, { fetch: fetch })
    let things = getThingAll(dataset)
    // things.forEach((th) => {
    //   console.log(th)
    //   bindingsTable.value.push([
    //     getUrl(th, RDF.type),
    // with getStringNoLocale, there is a problem with the strings encoded as "hello"^^<xsd:string>
    //     th.predicates[RDFS.seeAlso].literals['xsd:anyURI'][0],
    //     th.predicates[RDFS.comment].literals['xsd:string'][0], // [XSD.string],
    //     th.predicates[OWL.deprecated].literals['xsd:boolean'][0] // [XSD.boolean],
    //     // WORKS getUrlAll(th, ELI.hasMember)
    //   ])
    // })
    bindingsTable.value = things.filter(
      (th) =>
        getUrl(th, RDF.type) == props.classURI &&
        (th.predicates[props.propURI].literals['xsd:string'].includes(literal.value) ||
        //   th.predicates[props.propURI].literals['xsd:boolean'].includes(literal.value) ||
          getIri(th, props.propURI) == literal.value)
    )
    console.log(`done.`)
  } catch (error) {
    console.error(error)
  } finally {
    queryIsRunning.value = false
  }
}

const showDetails = ref(false)
</script>
<template>
  <BInputGroup prepend="Literal value" class="me-2">
    <BFormInput v-model="literal"></BFormInput>
    <BButton
      name="showQueryDetails"
      id="showQueryDetailButton"
      @click="showDetails = true"
      v-if="props.canShowDetails"
      ><IMdiTextBoxSearch class="mb-1" />Details</BButton
    >
    <BButton
      name="runQueryBtn"
      id="runQueryBtn"
      @click="searchThings"
      :loading="queryIsRunning"
      loading-text="Querying..."
      >Query
    </BButton>
  </BInputGroup>
  <BModal
    v-model="showDetails"
    title="Details"
    id="add-process-provider"
    size="lg"
    ok-only
    scrollable
    ><BCard header="Query">{{ query || `No query defined` }}</BCard
    ><BCard header="Outcome" class="mt-2"
      ><BTableSimple v-if="outputFormat.BINDINGS">
        <BTr><BTh>Value</BTh><BTh>TermType</BTh></BTr>
        {{ bindingsTable.map( (bindingsPair) => `<BTh>${bindingsPair[0]}</BTh
        ><BTh>${bindingsPair[1]}</BTh>` ) }}
      </BTableSimple>
      <p v-else>{{ bindingsTable }}</p></BCard
    >
  </BModal>
</template>

<style lang="scss" scoped></style>
