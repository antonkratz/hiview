import {
  FETCH_INTERACTIONS,
  RECEIVE_INTERACTIONS,
  SET_VALUE,
  SET_MAX_EDGE_COUNT,
  SET_ORIGINAL_EDGE_COUNT,
  SET_SELECTED,
  SET_SELECTED_PERM,
  DESELECT_PERM,
  CLEAR_SELECTED_PERM,
  SET_PRIMARY_EDGE_SCORE_RANGE,
  SET_MESSAGE,
  RECEIVE_SUMMARY,
  SET_RAW_SUMMARY,
  SET_AUTO_LOAD_THRESHOLD,
  SET_LOADING,
  SET_EDGE_SCORE_RANGE,
  SET_GROUP_POSITIONS,
  CLEAR_ALL,
  SET_SELECTED_EDGE,
  SET_ALL_POSITIONS,
  SET_PLEIO,
  SET_LEGEND
} from '../actions/raw-interactions'
import { Map, Set } from 'immutable'

const DEF_MAX_EDGE_COUNT = 10000
const LOADING_NETWORK_MESSAGE = 'Downloading all interactions from NDEx...'

const defState = Map({
  originalCX: null,
  loading: false,
  message: LOADING_NETWORK_MESSAGE,
  interactions: null,
  filters: null,
  extraEdges: null,
  maxEdgeCount: DEF_MAX_EDGE_COUNT,
  edgeScoreRange: [0.0, 1.0],
  originalEdgeCount: 0,
  selected: [],
  selectedEdge: null,
  selectedPerm: Set(),
  summary: null,
  autoLoadThreshold: 10000,
  plot: {
    range: {
      min: 0,
      max: 1
    }
  },
  groupPositions: {},
  allPositions: {},
  pleio: null,
  legend: {
    colors: {},
    names: {},
    nodeColors: {}
  }
})

export default function networkState(state = defState, action) {
  switch (action.type) {
    case CLEAR_ALL:
      return state
        .set('loading', false)
        .set('message', '')
        .set('interactions', null)
        .set('originalCX', null)
        .set('originalEdgeCount', 0)

    case FETCH_INTERACTIONS:
      return state
        .set('loading', true)
        .set('message', LOADING_NETWORK_MESSAGE)
        .set('interactions', null)
        .set('originalCX', null)
        .set('originalEdgeCount', 0)
    case RECEIVE_INTERACTIONS:
      return state
        .set('loading', false)
        .set('interactions', action.network)
        .set('originalCX', action.originalCX)
        .set('filters', action.filters)
        .set('groups', action.groups)
        .set('extraEdges', action.extraEdges)
    case RECEIVE_SUMMARY:
      return state
        .set('summary', action.summary)
        .set('interactions', null)
        .set('originalEdgeCount', action.summary.edgeCount)
    case SET_VALUE:
      const filters = state.get('filters')
      const attributeName = action.payload.attributeName
      let filterCount = attributeName.length

      let filter = null
      while (filterCount--) {
        const current = filters[filterCount]
        if (current.attributeName === attributeName) {
          filter = current
          break
        }
      }

      // const filter = state.get(action.payload.attributeName)
      if (filter.type === 'continuous') {
        filter.value = action.payload.value
      } else {
        filter.enabled = action.payload.enabled
      }

      return state.set('filters', filters)
    case SET_MAX_EDGE_COUNT:
      return state.set('maxEdgeCount', action.payload)
    case SET_PRIMARY_EDGE_SCORE_RANGE:
      return state.set('primaryEdgeScoreRange', action.payload)
    case SET_ORIGINAL_EDGE_COUNT:
      return state.set('originalEdgeCount', action.payload)

    case SET_SELECTED:
      return state.set('selected', action.payload)
    
    case SET_SELECTED_EDGE:
      return state.set('selectedEdge', action.payload)

    case SET_SELECTED_PERM:
      const currentSelection = state.get('selectedPerm')
      const newSet = currentSelection.union(Set(action.payload))
      return state.set('selectedPerm', newSet)

    case DESELECT_PERM:
      const originalSelection = state.get('selectedPerm')
      const diff = originalSelection.subtract(Set(action.payload))
      return state.set('selectedPerm', diff)

    case SET_MESSAGE:
      return state.set('message', action.payload)

    case SET_LOADING:
      return state.set('loading', true).set('message', action.payload)

    case SET_RAW_SUMMARY:
      return state
        .set('loading', false)
        .set('interactions', null)
        .set('summary', action.payload)

    case SET_AUTO_LOAD_THRESHOLD:
      return state.set('autoLoadThreshold', action.payload)

    case CLEAR_SELECTED_PERM:
      return state.set('selectedPerm', Set())

    case SET_EDGE_SCORE_RANGE:
      return state.set('edgeScoreRange', action.payload)

    case SET_GROUP_POSITIONS:
      return state.set('groupPositions', action.payload)

    case SET_ALL_POSITIONS:
      return state.set('allPositions', action.payload)
    case SET_PLEIO:
      if(state.get('pleio') === null) {
        return state.set('pleio', action.payload)
      } else {
        return state
      }

    case SET_LEGEND:
      const newLegend = {...state.get('legend'), ...action.payload}
      return state.set('legend', newLegend)

    default:
      return state
  }
}

