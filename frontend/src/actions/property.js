export const FETCH_PROPERTY = 'FETCH_PROPERTY'
const fetchProperty = (id, url, propType) => {
  return {
    type: FETCH_PROPERTY,
    url,
    id,
    propType
  }
}

export const RECEIVE_PROPERTY = 'RECEIVE_PROPERTY'
const receiveProperty = (id, url, json, propType) => {
  return {
    type: RECEIVE_PROPERTY,
    url,
    id,
    propType,
    data: json
  }
}

const fetchProp = url => {
  return fetch(url)
}

export const fetchPropertyFromUrl = (id, url, propType) => {
  return dispatch => {
    dispatch(fetchProperty(id, url, propType))

    return fetchProp(url)
      .then(response => response.json())
      .then(json => dispatch(receiveProperty(id, url, json, propType)))
  }
}

/**
 * Fetch Status of MyGene.info
 * 
 * @param {} param0 
 */
export const fetchMetadata = ({myGeneUrl}) => {
  return dispatch => {
    return fetch(myGeneUrl)
      .then(response => response.json())
      .then(json => dispatch(receiveMetadata(json)))
  }
}


export const RECEIVE_METADATA = 'RECEIVE_METADATA'
const receiveMetadata = (json) => {
  return {
    type: RECEIVE_METADATA,
    metadata: json
  }
} 


export const setProperty = (id, props, propType) => {
  return {
    type: RECEIVE_PROPERTY,
    id,
    propType,
    url: null,
    data: props
  }
}

export const CLEAR_PROPERTY = 'CLEAR_PROPERTY'
export const clearProperty = () => {
  return {
    type: CLEAR_PROPERTY,
    id: null,
    url: null,
    propType: null,
    data: {}
  }
}
