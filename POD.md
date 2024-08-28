# Solid POD storage and permissions overview

## Storage

### Root Container

We store (un)structured data as resources in (sub)Containers as provided within a Root Container by a POD provider. The URI of the root container will always be `https://storage.provider.com/{Storage-Identifier}/`. The ending `/` means the container resource can contain data or other container resources. This ending `/` will not be present on data resources (example is the Profile data resource as discussed below).

Technically, the Storage Identifier will assure unique ?s nodes for the data (and container) resources as follows:

- `<https://storage.provider.com/{Storage-Identifier}/data_resource>` for the ?s node of a RDF or non-RDF DATA resource
- `</{Storage-Identifier}/{Name Of Basic Container i}/>` for the CONTAINER resources, whereby the URL of the storage provider is not in the ?s IRI.

As linked data, the [user's root storage container](https://solidproject.org/TR/protocol#root-container) will be described as a `BasicContainer`, while the server itself will be a `pim:Storage` resource:

```
<https://storage.provider.com/>
        rdf:type      pim:Storage;

<https://storage.provider.com/{Storage-Identifier}/>
        rdf:type      ldp:BasicContainer;
```


### Other Basic Containers

Other basic containers are 'findable' because they are already defined at root container level using `ldp:contains`:

```
<https://storage.provider.com/{Storage-Identifier}/>
        rdf:type      ldp:BasicContainer;
        ldp:contains  </{Storage-Identifier}/profile> , # data resource, see below
                      </{Storage-Identifier}/{Name Of Basic Container 1}/> ,  # container resource
                      </{Storage-Identifier}/{Name Of Basic Container 2}/> ,
        # etc ...
                      </{Storage-Identifier}/{Name Of Basic Container N}/> .
```

The basic containers are also defined in the RDF present at root level:

```
</{Storage-Identifier}/{Name Of Basic Container i}/>  # For all containers i
        rdf:type      ldp:BasicContainer;
```

The /profile resource is not a Basic Container but a data resource.

### Data resources linked at root level

Any data resource (RDF or other) will always be represented as a unique subject node and their membership within a Container is formalized using the `ldp:contains`-ObjectProperty.

Two particular data resources are DESCRIBED at root level:
- for the user/organisation `Profile`
- for the access rights of the root level: the Access Control List

#### Profile

Every Solid Pod MUST contain a (WebId Profile resource)[https://solid.github.io/webid-profile/] like so:

```
</{Storage-Identifier}/profile> # note the subject node of this structured data resource
        rdf:type  ldp:RDFSource .
```

The CONTENTS are mandatory as the profile defines the core user resource of the Solid Pod. Minimally it will contain:

```
<https://storage.provider.com/{Storage-Identifier}/profile> # note the different subject node as above
        a                  foaf:Document;
        foaf:maker         <https://id.inrupt.com/certiman>; # example of user IRI
        foaf:primaryTopic  <https://id.inrupt.com/certiman> . # as the topic of the RDF is this user itself
```

The user data (which is considered private) can be extended with addresses, phone numbers etc, but should at least contain the user/organisation's name and a privateTypeIndex, which is typically stored in the `settings/`-container:

```
<https://id.inrupt.com/certiman>
        a          <http://schema.org/Person>;
        # (email) addresses and phone numbers added using ?p
        # <http://www.w3.org/2006/vcard/ns#hasAddress>, <http://www.w3.org/2006/vcard/ns#hasEmail>, <http://www.w3.org/2006/vcard/ns#hasTelephone>...
        <http://www.w3.org/ns/solid/terms#privateTypeIndex>
                <https://storage.provider.com/{Storage-Identifier}/settings/privateTypeIndex>;  # see below
        foaf:name  "Maarten" .
```

#### The Access Control List

Please see below for controlling access with ACP (there is another method ([Web Access Control](https://solidproject.org/TR/protocol#web-access-control)) not discussed here). 

### The `privateTypeIndex` data resource

The intention of [TypeIndexes](https://solid.github.io/type-indexes/) is to help Solid applications to find the correct container resources, based on the Class of the instances to be managed (edited). Therefore, the TypeIndex will help to clarify where the application should store instances of each such class.

If not present, applications [MAY](https://solid.github.io/type-indexes/#supplying-missing-type-index-documents) ask the user where to store their instances.

Initially, the data resource for the private types looks liks:

```
<https://storage.provider.com/{Storage-Identifier}/settings/privateTypeIndex>
        a       <http://www.w3.org/ns/solid/terms#TypeIndex> , <http://www.w3.org/ns/solid/terms#UnlistedDocument> .

# For all classes to be managed
<https://storage.provider.com/{Storage-Identifier}/settings/privateTypeIndex#{Unique_ID of the registration}>
        a       <http://www.w3.org/ns/solid/terms#TypeRegistration>;
        <http://www.w3.org/ns/solid/terms#forClass>
                {IRI of the class to control instance editing for} ;
        <http://www.w3.org/ns/solid/terms#instanceContainer>
                <https://storage.inrupt.com/{Storage-Identifier}/{Name Of Basic Container to Use for these instances}/> .
```

### A non-RDF resource in a Container

The file will be stored at the storage provider, and be expressed as such within a Basic Container, like so:

```
<https://storage.provider.com/{Storage-Identifier}/{ContainerId}/{SubCOntainerId/>
        rdf:type      ldp:BasicContainer;
        ldp:contains  </{Storage-Identifier}/{ContainerId}/{SubCOntainerId/example_file.ttl> .

</{Storage-Identifier}/{ContainerId}/{SubCOntainerId/example_file.ttl>
        rdf:type  ldp:NonRDFSource .
```

The file can be fetched classically and in any webbrowser retrieved and displayed through a blob URI.

## Container-based Access Control Policy ([ACP](https://solid.github.io/authorization-panel/acp-specification/))

To manage the below in an application, the Inrupt [solid-client JS library](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/manage-acp/) is available. When stable in the future, access is best handled in Solid apps via the Universal Access API.

When using ACPolicies, the root Container will describe the access granted to its resources as follows, where the triples are addressed under the ACP-server.
- The container Access Control Resource, linking to the AccessControl (and potential members)
```
acp:accessControl
  The access control property connects ACRs to Access Controls.
acp:memberAccessControl
  The member access control property transitively connects ACRs of member resources to Access Controls.
```
- The AC linking to the Policy
- The Policy defining the allowed operations, for the Matcher
- The Matcher containing the WebID's of the users having these rights.

The below RDF hence defines read/write access to all resources in the containers of Certiman:

```
<https://authorization.provider.com/{ACL-Identifier-For-Root-Container}
    a         <http://www.w3.org/ns/solid/acp#AccessControlResource> ;
    <http://www.w3.org/ns/solid/acp#accessControl> <https://authorization.provider.com/{ACL-Identifier-For-Root-Container}#{AC Identifier}> ;
    <http://www.w3.org/ns/solid/acp#memberAccessControl> <https://authorization.provider.com/{ACL-Identifier-For-Root-Container}#{AC Identifier}> .

<https://authorization.provider.com/{ACL-Identifier-For-Root-Container}#{AC Identifier}>
    a        <http://www.w3.org/ns/solid/acp#AccessControl> ;
    <http://www.w3.org/ns/solid/acp#apply> <https://authorization.provider.com/{ACL-Identifier-For-Root-Container}#{Policy Identifier}> .

<https://authorization.provider.com/{ACL-Identifier-For-Root-Container}#{Policy Identifier}>
    a        <http://www.w3.org/ns/solid/acp#Policy> ;
    <http://www.w3.org/ns/solid/acp#allOf> <https://authorization.provider.com/{ACL-Identifier-For-Root-Container}#{Matcher Identifier}> ;
    <http://www.w3.org/ns/solid/acp#allow> <http://www.w3.org/ns/auth/acl#Read> , <http://www.w3.org/ns/auth/acl#Write> .

<https://authorization.provider.com/{ACL-Identifier-For-Root-Container}#{Matcher Identifier}>
    a <[http://www.w3.org/1999/02/22-rdf-syntax-ns#type](http://www.w3.org/ns/solid/acp#Matcher)> ;
    <http://www.w3.org/ns/solid/acp#agent> <https://id.inrupt.com/certiman> .
```

For each underlying container, an AC Resource is present and points to the Root Container's Access Control, as it reuses the permissions throughout the tree of containers, as defined under the linked applied Policy:

```
<https://authorization.provider.com/{ACL-Identifier-For-Some-Basic-Container}
    a         <http://www.w3.org/ns/solid/acp#AccessControlResource> ;
    <http://www.w3.org/ns/solid/acp#accessControl> <https://authorization.provider.com/{ACL-Identifier-For-Root-Container}#{AC Identifier}> .
```

## Example for the basic solid pod application

Open point.







