export function dataGetter() {
  let q1 = `PREFIX simulink: <http://mathworks.com/simulink/rdf#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX oslc_cm: <http://open-services.net/ns/cm#>
    PREFIX model11: <https://vservices.offis.de/rtp/simulink/v1.0/services/model11/>
    PREFIX bugzilla: <https://vservices.offis.de/rtp/bugzilla/v1.0/>

    construct {?s ?r ?o.}
    where {graph ?g {
      ?s ?r ?o.
    <https://vservices.offis.de/rtp/simulink/v1.0/services/model11/model/> ?p ?o.}
    }`;


}
