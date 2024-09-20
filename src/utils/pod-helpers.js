/**
 * Helper file functions purely assisting in i/o with Solid Pods
 */
import { getFile, getSolidDataset, toRdfJsDataset } from '@inrupt/solid-client'
import { fetch } from '@inrupt/solid-client-authn-browser'

// helper
export const getDSUriEnding = (fullUri) => fullUri.substr(fullUri.lastIndexOf('/'))

// Shape files are alas non-RDF resources
// reset forces a new Blob
// Usae would be IFF POSSIBLE (NOT as an event trigger)
// BookUrlValues.value = await loadDataAndShapesFromNonRDFFile(
//   dataShapesLoaded.value,
//   SHAPE_DATA_URL,
//   props.BookUrl,
//   store
// )
export const loadDataAndShapesFromNonRDFFile = async (
  shapeAvailable,
  shapeDataUri,
  datasetUri,
  store
) => {
  let data_blob_url, foundData
  try {
    if (shapeAvailable) {
      console.log(`Trying to (re)load the shapes from POD (viewing purpose)!`)
      const data_blob = await getFile(shapeDataUri, { fetch: fetch })
      data_blob_url = URL.createObjectURL(data_blob)
      store.allShapeBlobUrls.push(data_blob_url)
    } else {
      console.warn(`Blob SHAPE URL from cache, length ${store.allShapeBlobUrls.length}`)
    }
  } catch (err) {
    console.error(`Failed loading file, check access: ${err}`)
  } finally {
    // Grab the dataset from the URL and convert to RDF
    console.log(`Dataset is being grabbed from ${getDSUriEnding(datasetUri)}.`)
    const foundDataSet = await getSolidDataset(datasetUri, { fetch: fetch })
    foundData = toRdfJsDataset(foundDataSet)
  }
  return foundData 
}
