import React, { useState, useEffect } from 'react'
import CyNetworkViewer from '@cytoscape/cy-network-viewer'
import { CytoscapeJsRenderer } from '@cytoscape/cytoscapejs-renderer'
import LoadingPanel from './LoadingPanel'
import { Set } from 'immutable'
import { MAIN_EDGE_TAG } from '../../actions/raw-interactions-util'

import { insertEdgeColorMapping, applyNodeColoring } from '../../utils/vs-util'
import CustomPopover from '../CustomPopover'

import { parseProps } from '../../utils/edge-prop-util'
import { NDEX_EVIDENCE_KEY } from './EdgeInfoPanel'

import { NODE_STYLE } from '../../reducers/ui-state'

const Viewer = CyNetworkViewer(CytoscapeJsRenderer)

// TODO: Remove this - this is a special case for Anton's data
const DDRAM_TOOLTIP_KEY = ['pleio', 'systems', 'dominantEvidence']

const RawInteractionPanel = (props) => {
  const {
    uiState,
    subnet,
    networkStyle,
    enrichment,
    enrichmentActions,
    selectedTerm,
    commandActions,
    filters,
    networkAreaStyle,
    setCy,
    setHandleSvg,
    rawInteractions,
    rawInteractionsActions,
    queryPathsActions,
    location,
  } = props

  const serverType = location.query.type
  const filterState = uiState.get('filterState')
  const showPleioEdges = uiState.get('showPleioEdges')
  const nodeStyle = uiState.get('nodeStyle')

  const [styleMap, setStyleMap] = useState({})

  useEffect(() => {
    console.log('initialization', styleMap, rawInteractions)
  }, [])

  const applyStyle = (styleName) => {
    if (cyReference === null || cyReference === undefined) {
      return
    }

    // let style = styleMap[styleName]
    // if (style !== undefined) {
    //   // Already exists. Apply as-is
    //   cyReference.style().fromJson(style).update()
    //   return
    // }

    // Update the style
    // const copiedStyle = JSON.parse(JSON.stringify(networkStyle))

    const currentLegend = rawInteractions.get('legend')
    const newStyle = applyNodeColoring({
      styleName,
      style: originalVS.style,
      rawInteractions,
      rawInteractionsActions,
    })
    cyReference.style().fromJson(newStyle).update()
    setStyleMap({ ...styleMap, [styleName]: newStyle })
  }

  useEffect(() => {
    if (nodeStyle === null) {
      return
    }
    applyStyle(nodeStyle)
  }, [nodeStyle])

  useEffect(() => {
    if (cyReference === null || cyReference === undefined) {
      return
    }

    updatePleioEdges(showPleioEdges)
  }, [showPleioEdges])

  const updatePleioEdges = (showPleioEdges) => {
    const pleioEdges = cyReference.edges('edge[?isPleio]')
    if (pleioEdges.length === 0) {
      return
    }

    if (showPleioEdges) {
      pleioEdges.removeClass('hidePleio')
    } else {
      pleioEdges.addClass('hidePleio')
    }
  }

  // For switching VS
  const enableCustomStyling = uiState.get('enableCustomStyling')
  const [originalVS, setOriginalVS] = useState(null)
  const [vsUpdated, setVsUpdated] = useState(false)

  // These attributes will be rendered as tooltip text
  const [tooltipKeys, setTooltipKeys] = useState([])

  // Cytoscape.js reference
  const [cyReference, setCyReference] = useState(null)
  const [openPopover, setOpenPopover] = useState(false)

  // Custom event handler for node click / tap
  const selectNodes = (nodeIds, nodeProps, rawEvent) => {
    const node = nodeIds[0]
    const props = nodeProps[node]
    const name = props.name
    const { cy } = rawEvent
    if (cy === undefined || cy === null) {
      return
    }

    // Get CyNode
    const selectedNode = rawEvent.target
    const connectedEdges = selectedNode.connectedEdges('edge[?isPleio]')
    if (connectedEdges.length > 0) {
      connectedEdges.addClass('connectedEdge')
      const connectedNodes = connectedEdges.connectedNodes()
      console.log('connected', connectedNodes.addClass('connected'))
    }
  }

  const deselectNodes = (nodeIds, rawEvent) => {
    console.log(rawEvent)
    const { cy } = rawEvent
    if (cy === undefined || cy === null) {
      return
    }

    // remove class
    const selectedNode = rawEvent.target
    const connectedEdges = selectedNode.connectedEdges()
    if (connectedEdges.length > 0) {
      connectedEdges.removeClass('connectedEdge')
      const connectedNodes = connectedEdges.connectedNodes()
      console.log('connected', connectedNodes.removeClass('connected'))
    }
  }

  const selectEdges = (edgeIds, edgeProps, rawEvent) => {
    const { cy } = rawEvent
    if (cy === undefined || cy === null) {
      return
    }

    if (
      edgeIds === undefined ||
      edgeIds === null ||
      !Array.isArray(edgeIds) ||
      edgeIds.length === 0
    ) {
      return
    }

    const edgeId = edgeIds[0]
    if (edgeProps === undefined || edgeProps === null) {
      return
    }

    const edgeData = edgeProps[edgeId]

    if (edgeData !== undefined) {
      setTimeout(() => {
        const { source, target } = edgeData
        const s = cy.elements(`node#${source}`)
        const t = cy.elements(`node#${target}`)

        const sName = s[0].data('name')
        const tName = t[0].data('name')

        const selectedEdgeData = {
          source: sName,
          target: tName,
          edge: edgeData,
        }

        rawInteractionsActions.setSelectedEdge(selectedEdgeData)

        // Query network

        const evidence = edgeData[NDEX_EVIDENCE_KEY]
        if (
          evidence === undefined ||
          evidence === null ||
          !Array.isArray(evidence)
        ) {
          return
        }

        const evidences = evidence.map((ev) => parseProps(ev))

        if (evidences === undefined || evidences.length === 0) {
          return
        }

        const uuidMap = new Map()

        evidences.forEach((ev) => {
          const { interactome_uuid } = ev
          const key = ev['feature']

          if (interactome_uuid !== undefined && interactome_uuid !== '') {
            uuidMap.set(key, interactome_uuid)
          }
        })

        queryPathsActions.queryPaths({
          uuidMap,
          serverType: serverType,
          genes: [sName, tName],
        })
      }, 100)
    }
  }

  const deselectEdges = (edgeIds) => {
    console.log('Edge deselected:', edgeIds)
    rawInteractionsActions.setSelectedEdge(null)
  }

  useEffect(() => {
    if (cyReference !== null && cyReference !== undefined) {
      setCy(cyReference)
      setTimeout(() => {
        updatePleioEdges(showPleioEdges)
      }, 100)
    }
  }, [cyReference])

  useEffect(() => {
    // Check whether enrichment analysis is required or not
    if (!uiState.get('runEnrichment')) {
      return
    }
    if (enrichment.running) {
      return
    }
    if (subnet === null || subnet === undefined) {
      return
    }

    const genes = Set(subnet.elements.nodes.map((node) => node.data.name))
    enrichmentActions.runEnrichment(
      'https://amp.pharm.mssm.edu/Enrichr/addList',
      genes,
      selectedTerm,
    )
  }, [uiState.get('runEnrichment'), subnet])

  useEffect(() => {
    // if (originalVS === null) {
    //   const clone = JSON.parse(JSON.stringify(networkStyle))
    //   setOriginalVS(clone)
    // }

    if (vsUpdated) {
      return
    }

    if (enableCustomStyling === false) {
      return
    }

    // Test subnet to check it has required attributes
    const { elements } = subnet
    const { nodes, edges } = elements
    // if (
    //   nodes[0] === undefined
    //   // nodes[0]['data'][NODE_COLOR_KEY] === undefined
    // ) {
    //   return
    // }

    // // Update visual style if necessary
    // let attrNames = []
    // if (filters !== undefined) {
    //   // Note: this always contains "Score"
    //   const attrs = filters.filter((filter) => filter.attributeName !== 'Score')
    //   attrNames = attrs.map((attr) => attr.attributeName)
    // }

    insertEdgeColorMapping({
      nodes,
      edges,
      vs: networkStyle,
      metadata: subnet.data,
      rawInteractionsActions,
    })

    setTooltipKeys(DDRAM_TOOLTIP_KEY)

    // Modify style only once
    setVsUpdated(true)

    // Save original style
    setOriginalVS({ ...networkStyle })

    // const clone = JSON.parse(JSON.stringify(networkStyle.style))
    // const fMap = extractFunctionMaps(networkStyle.style)
    setStyleMap({ [NODE_STYLE.MEMBERSHIP]: [...networkStyle.style] })
  }, [networkStyle])

  const extractFunctionMaps = (style) => {
    const functionMaps = {}
    style.forEach((entry) => {
      const { selector, css } = entry
      const keys = Object.keys(css)
      keys.forEach((key) => {
        const value = css[key]
        if (typeof value === 'function') {
          if (functionMaps[selector] === undefined) {
            functionMaps[selector] = {}
          }
          functionMaps[selector][key] = value
        }
      })
    })
    return functionMaps
  }

  // useEffect(() => {
  //   // No need to change if original styling (no edge mapping) is used.
  //   if (
  //     networkStyle === originalVS ||
  //     networkStyle === null ||
  //     cyReference === null
  //   ) {
  //     return
  //   }

  //   const curFilter = filterState.toJSON()
  //   const filterNames = Object.keys(curFilter)
  //   const filterLen = filterNames.length

  //   if (filterLen === 0) {
  //     return
  //   }
  // }, [filterState])

  // useEffect(() => {
  //   if (cyReference !== null) {
  //     let newStyle = networkStyle.style
  //     if (!enableCustomStyling) {
  //       newStyle = originalVS.style
  //     }
  //     cyReference.style().fromJson(newStyle).update()
  //   }
  // }, [enableCustomStyling])

  const commandFinished = (lastCommand, status = {}) => {
    commandActions.clearCommand()
  }
  const hoverOnNode = (nodeId, nodeProps) => {
    console.log(nodeId, nodeProps)
  }

  const hoverOutNode = (nodeId, nodeProps) => {
    // console.log("Hover out:")
    console.log(nodeId, nodeProps)
  }

  // Then use it as a custom handler
  const getCustomEventHandlers = () => ({
    selectNodes,
    selectEdges,
    deselectNodes,
    deselectEdges,
    // hoverOnNode,
    // hoverOutNode,
    commandFinished,
  })

  const newNet = subnet
  const visualStyle = props.networkStyle
  const hidePrimary = !uiState.get('enablePrimaryEdge')

  if (newNet === null || newNet === undefined || visualStyle === null) {
    if (props.loading) {
      return <LoadingPanel message={'Loading network...'} />
    } else {
      return <div>Finalizing...</div>
    }
  }

  const selected = {
    nodes: props.subnetSelected,
    edges: props.subnetSelectedEdge,
    nodesPerm: props.subnetSelectedPerm,
    edgesPerm: props.subnetSelectedEdgePerm,
  }

  const hidden = {
    nodes: [],
    edges: [],
  }

  if (filters === null || filters.length === 0) {
    return (
      <React.Fragment>
        <Viewer
          key="subNetworkView"
          network={subnet}
          selected={selected}
          hidden={hidden}
          hidePrimary={hidePrimary}
          networkType={'cyjs'}
          networkStyle={visualStyle}
          style={networkAreaStyle}
          eventHandlers={getCustomEventHandlers()}
          rendererOptions={{
            layout: checkPresetLayout(subnet),
            tooltipKeys,
          }}
          command={props.commands}
          setRendererReference={setCyReference}
        />
        <CustomPopover open={openPopover} />
      </React.Fragment>
    )
  }

  return (
    <React.Fragment>
      <Viewer
        key="subNetworkView"
        network={subnet}
        selected={selected}
        hidden={hidden}
        hidePrimary={hidePrimary}
        networkType={'cyjs'}
        networkStyle={visualStyle}
        style={networkAreaStyle}
        eventHandlers={getCustomEventHandlers()}
        rendererOptions={{
          layout: checkPresetLayout(subnet),
          tooltipKeys: [],
        }}
        command={props.commands}
        setRendererReference={setCyReference}
      />
      <CustomPopover open={openPopover} />
    </React.Fragment>
  )
}

const checkPresetLayout = (network) => {
  return 'preset'
}

export default RawInteractionPanel
