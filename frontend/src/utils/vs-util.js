import { getColorAccent, getColor10 } from './color-util'
import { NODE_STYLE, NODE_TAGS } from '../reducers/ui-state'

const findSelector = (style, selectorName) => {
  return style.find((s) => s.selector === selectorName)
}

const applyNodeColoring = ({
  styleName,
  style,
  rawInteractions,
  rawInteractionsActions,
}) => {
  const legend = rawInteractions.get('legend')

  // Create a deep copy of the style
  const cloneStyle = [...style]
  const nodeSelector = findSelector(cloneStyle, 'node')
  const nodeColorMapping = getStylePresets({
    styleName,
    rawInteractionsActions,
    legend,
  })
  if (nodeColorMapping !== null) {
    nodeSelector.css['background-color'] = nodeColorMapping
  }
  return cloneStyle
}

const defColor = 'rgba(30,30,30,0.5)'
const accentColor = getColorAccent(1)

const getStylePresets = ({ styleName, rawInteractionsActions, legend }) => {
  let colorMappingFunction = null

  if (styleName === NODE_STYLE.MEMBERSHIP) {
    // Use original mapping
    return 'data(color)'
  }

  if (styleName === NODE_STYLE.BAIT_PREY) {
    const types = ['bait', 'prey', 'none']
    const colors = [getColorAccent(1), getColorAccent(3), defColor]

    const mapping = types.map((type, index) => {
      return {
        value: type,
        color: colors[index],
      }
    })
    storeLegend({ styleName, mapping, rawInteractionsActions, legend })

    colorMappingFunction = (n) => {
      const type = n.data(NODE_TAGS.apmsType)
      return colors[types.indexOf(type)]
    }
  } else if (styleName === NODE_STYLE.DOMINANT_EVIDENCE) {
    const types = ['Codependency', 'Coabundance', 'Coexpression', 'Physical']
    const mapping = types.map((type, index) => {
      return {
        value: type,
        color: getColorAccent(index+1),
      }
    })
    storeLegend({ styleName, mapping, rawInteractionsActions, legend })

    colorMappingFunction = (n) => {
      const type = n.data(NODE_TAGS.dominantDataType)
      return getColorAccent(types.indexOf(type) +1)
    }
  } else if (styleName === NODE_STYLE.PLEIO) {
    const mapping = [
      {
        value: NODE_TAGS.pleioType,
        color: accentColor,
      },
      {
        value: 'none',
        color: defColor,
      },
    ]
    storeLegend({ styleName, mapping, rawInteractionsActions, legend })
    colorMappingFunction = (n) => {
      const type = n.data(NODE_TAGS.pleioType)
      return type ? accentColor : defColor
    }
  } else if (styleName === NODE_STYLE.CURATION) {
    const types = ['Curated', 'Uncurated']
    const mapping = [
      {
        value: types[0],
        color: accentColor,
      },
      {
        value: types[1],
        color: defColor,
      },
    ]
    storeLegend({ styleName, mapping, rawInteractionsActions, legend })
    colorMappingFunction = (n) => {
      const type = n.data(NODE_TAGS.curatedType)
      return type === types[0] ? accentColor : defColor
    }
  }

  return colorMappingFunction
}
const storeLegend = ({
  styleName,
  rawInteractionsActions,
  legend,
  mapping,
}) => {
  rawInteractionsActions.setLegend({
    nodeColors: {
      ...legend.nodeColors,
      [styleName]: mapping,
    },
  })
}

const insertNodeColorMapping = (vs, keyAttrName, attrValues) => {
  if (
    vs === null ||
    vs === undefined ||
    keyAttrName === undefined ||
    keyAttrName === null
    // Array.isArray(attrValues) === false ||
    // attrValues.length === 0
  ) {
    return
  }

  const sortedValues = attrValues.sort()
  const valueLen = sortedValues.length
  const vsClone = Object.assign(vs)

  for (let idx = 0; idx < valueLen; idx++) {
    let color = getColor10(idx)
    const attrVal = sortedValues[idx]
    const attrSelector = {
      selector: `node[${keyAttrName} = "${attrVal}"]`,
      css: {
        'text-background-color': color,
        'text-background-opacity': 1,
        'text-outline-width': 0.5,
        'background-opacity': 1,
        'background-color': color,
      },
    }
    vsClone.style.push(attrSelector)
  }

  // Node shape mappings for pleio
  const shapeAttrSelector = {
    selector: 'node[pleio]',
    css: {
      'background-opacity': 0.9,
      'text-background-opacity': 0,
      shape: (ele) => {
        const val = ele.data('pleio')
        if (val === undefined) {
          return 'roundrectangle'
        }

        const numericVal = Number.parseInt(val)
        if (Number.isInteger(numericVal) && numericVal > 1) {
          return 'ellipse'
        }

        return 'roundrectangle'
      },
    },
  }
  vsClone.style.push(shapeAttrSelector)
  return vsClone
}

const insertEdgeColorMapping = ({
  nodes,
  edges,
  vs,
  metadata,
  rawInteractionsActions,
}) => {
  const vsClone = Object.assign(vs)

  let currentGroups = new Set()
  if (metadata.Group !== undefined) {
    currentGroups = new Set(metadata.Group.split('|'))
  }

  const { groupColorMap, parent } = getColorMap(nodes, currentGroups)

  rawInteractionsActions.setLegend({
    colors: Object.fromEntries(groupColorMap),
  })

  // Assign color to nodes and get the map of nodes
  const id2node = assignNodeColor(nodes, groupColorMap)
  assignEdgeColor(id2node, groupColorMap, edges, parent)

  const edgeColorMapping = {
    selector: 'edge',
    // selector: `edge[${attrName}]`,
    css: {
      'line-color': 'data(color)',
      'z-index': 'data(zIndex)',
    },
  }

  vsClone.style.push(edgeColorMapping)
  return vsClone
}

const getColorMap = (nodes, currentGroups) => {
  const groupSet = new Set()

  nodes.forEach((node) => {
    const { data } = node
    const { baseGroup } = data
    groupSet.add(baseGroup)
  })
  const parent = [...groupSet].filter((g) => !currentGroups.has(g))[0]
  const groupList = Array.from(groupSet)

  const groupColorMap = new Map()
  groupList.forEach((group, index) => {
    if (group === parent) {
      groupColorMap.set(group, 'rgba(80,80,80, 0.5)')
    } else {
      groupColorMap.set(group, getColor10(index))
    }
  })
  return { groupColorMap, parent }
}

const assignNodeColor = (nodes, groupColorMap) => {
  const id2node = new Map()

  nodes.forEach((node) => {
    const { data } = node
    const { baseGroup } = data
    data['color'] = groupColorMap.get(baseGroup)
    id2node.set(data.id, node)
  })

  return id2node
}

const getGroupMembers = (nodes, positions) => {
  const groups = new Map()
  const ids = Object.keys(positions)

  nodes.forEach((node) => {
    const { data } = node
    const geneSymbol = data.name
    const matched = ids.filter((id) => id.startsWith(geneSymbol))

    groups.set(geneSymbol, matched)
  })

  return groups
}

const GROUP_PREFIX = 'Group:'
const getMemberInfo = (nodes) => {
  const groups = new Map()

  nodes.forEach((node) => {
    const { data } = node
    const { gName, baseGroup } = data

    for (let key in data) {
      if (key.startsWith(GROUP_PREFIX)) {
        const isMember = data[key]
        const groupNumbers = key.split(':')
        const groupId = groupNumbers[1]
        const memberSet = groups.get(groupId)
        if (isMember) {
          if (memberSet === undefined) {
            const memberSet = new Set()
            memberSet.add(data.id)
            groups.set(groupId, memberSet)
          } else {
            memberSet.add(data.id)
            groups.set(groupId, memberSet)
          }
        }
      }
    }
  })

  return groups
}

const getGroupEdgeColor = (edge, groups) => {
  const { data } = edge
  const { source, target } = data
  let color = null

  let index = 0
  groups.forEach((value) => {
    const memberSet = value
    if (memberSet.has(source.toString()) && memberSet.has(target.toString())) {
      if (color === null) {
        color = getColor10(index)
      }
    }
    index++
  })

  return color
}

const assignEdgeColor = (id2node, groupColorMap, edges, parent) => {
  edges.forEach((e) => {
    const { data } = e
    const sourceId = data.source
    const targetId = data.target
    const source = id2node.get(sourceId.toString())
    const target = id2node.get(targetId.toString())

    const sourceGroup = source.data.baseGroup
    const targetGroup = target.data.baseGroup
    if (
      sourceGroup !== targetGroup ||
      sourceGroup === parent ||
      targetGroup === parent
    ) {
      data['color'] = '#777777'
      data['isMember'] = false
      data['zIndex'] = 0
    } else {
      data['isMember'] = true
      data['color'] = groupColorMap.get(sourceGroup)
      data['zIndex'] = 999
    }

    if (data['isPleio']) {
      data['color'] = '#FFFFFF'
      data['zIndex'] = 9900
    }
  })
}

export { insertNodeColorMapping, insertEdgeColorMapping, applyNodeColoring }
