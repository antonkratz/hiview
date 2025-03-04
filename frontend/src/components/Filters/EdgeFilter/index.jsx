import React, { Component } from 'react'

import {
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@material-ui/core'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import ViewListIcon from '@material-ui/icons/ViewList'
import { withStyles } from '@material-ui/core/styles'

import ContinuousFilter from './ContinuousFilter'
import BooleanFilter from './BooleanFilter'

import PrimaryEdgeSwitch from './PrimaryEdgeSwitch'
import PleioEdgeSwitch from './PleioEdgeSwitch'

import { getColor10 } from '../../../utils/color-util'
import { DownloadButton } from './DownloadButton'

const EDGE_GROUP_TAG = 'edge groups'
const OTHERS_TAG = 'Others'

const FILTER_TYPES = {
  CONTINUOUS: 'continuous',
  BOOLEAN: 'boolean',
}

const TOOLTIP_TEXTS = {
  DOWNLOAD: 'Download fully connected DAS score network',
  PRIMARY:
    'Show the DAS score network. You can click on "DAS score" to download the fully connected DAS network of DDRAM.',
  AP_MS: '[Kratz et al, 2022; under review]',
  PLEIO:
    'Show connection between multiple instances of a pleiotropic protein. Connections are only shown for instances at or below the current assembly.',
}
const NDEX_LINK_TAGS = {
  APMS_LINK: 'ndex:apms_network',
  SCORE_LINK: 'ndex:score_network',
}

const styles = (theme) => ({
  root: {
    position: 'relative',
    background: 'inherit',
    padding: theme.spacing(2),
    paddingTop: 0,
  },
  title: {
    height: '2em',
  },
  title2: {
    margin: 0,
    padding: 0,
    color: '#666666',
    marginBottom: theme.spacing(1),
  },
  list: {
    overflow: 'auto',
  },
  listItemLarge: {
    margin: 0,
  },
  listItem: {
    margin: 0,
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
})

class EdgeFilter extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: true,
      selected: new Array(5),
    }
  }

  onAfterChange = (value) => {
    console.log(value)
  }

  handleExpand = (event, val) => {
    this.setState({ [val]: !this.state[val] })
  }

  handleChange = (name) => (event) => {
    this.setState({ [name]: event.target.checked })
  }

  handleClick = (event) => {
    const isOpen = this.state.open

    this.setState({
      open: !isOpen,
    })
  }

  createCategories = (edgeGroupString) => {
    const parts = edgeGroupString.split('|')

    const result = {}
    const cat2filter = {}

    parts.forEach((entry) => {
      const subCategories = entry.split(',')
      const header = subCategories[0]
      const categories = subCategories.slice(1, subCategories.length)

      cat2filter[header] = new Set(categories)

      categories.forEach((cat) => {
        result[cat.replace('-', '_')] = header
      })
    })

    const bothMap = {
      filter2cat: result,
      cat2filter,
    }
    return bothMap
  }

  render() {
    const { classes } = this.props
    const { filters, networkData, uiState, uiStateActions } = this.props
    const filterState = uiState.get('filterState')

    let edgeGroupsText = null
    let categories = {}

    const links = {}

    if (networkData !== undefined) {
      edgeGroupsText = networkData[EDGE_GROUP_TAG]

      if (edgeGroupsText !== undefined) {
        categories = this.createCategories(edgeGroupsText)
      }

      Object.keys(NDEX_LINK_TAGS).map(key => {
        const linkTag = NDEX_LINK_TAGS[key]
        const rawString = networkData[linkTag]
        const linkObject = JSON.parse(rawString)
        links[linkTag] = linkObject

      })
    }

    if (!filters || filters.length === 0 || !Array.isArray(filters)) {
      return <div />
    }

    const filterNames = []
    const filterMap = {}

    filters.forEach((filter) => {
      const isPrimary = filter.isPrimary
      if (!isPrimary) {
        filterNames.push(filter.attributeName)
        filterMap[filter.attributeName] = filter
      }
    })

    const sortedNames = filterNames.sort()

    if (edgeGroupsText === undefined) {
      // Old data format.  Just render plain list
      return (
        <div className={classes.root}>
          <Typography variant="h6" className={classes.title2}>
            Protein Interactions
          </Typography>
          <div className={classes.filterRow}>
            <PrimaryEdgeSwitch
              uiState={uiState}
              uiStateActions={uiStateActions}
              tooltip={TOOLTIP_TEXTS.PRIMARY}
            />
            <DownloadButton
              url={links[NDEX_LINK_TAGS.SCORE_LINK].url}
              tooltip={links[NDEX_LINK_TAGS.SCORE_LINK].tooltip}
            />
          </div>
          {sortedNames.map((filterName, idx) => (
            <div key={filterName} className={classes.filterRow}>
              {this.getFilter(
                idx,
                filterMap[filterName],
                filterState,
                uiStateActions,
              )}
              <DownloadButton
                url={links[NDEX_LINK_TAGS.APMS_LINK].url}
                tooltip={links[NDEX_LINK_TAGS.APMS_LINK].tooltip}
              />
            </div>
          ))}
          <PleioEdgeSwitch
            tooltip={TOOLTIP_TEXTS.PLEIO}
            uiState={uiState}
            uiStateActions={uiStateActions}
          />
        </div>
      )
    }

    // Now creates sub-categories
    return (
      <div className={classes.root}>
        <Typography variant="subtitle1" className={classes.title}>
          Interaction Features:
        </Typography>
        <PrimaryEdgeSwitch uiState={uiState} uiStateActions={uiStateActions} />

        {this.generateFilterList(
          sortedNames,
          filterMap,
          categories.filter2cat,
          categories.cat2filter,
          filterState,
          uiStateActions,
        )}
      </div>
    )
  }

  generateFilterList = (
    sortedNames,
    filterMap,
    filter2cat,
    cat2filter,
    filterState,
    uiStateActions,
  ) => {
    if (!filter2cat) {
      return <List />
    }
    const tags = new Set(Object.values(filter2cat))
    let sortedCategoryNames = [OTHERS_TAG, ...tags].sort()

    const filterListMap = this.getExistingFilters(
      sortedNames,
      cat2filter,
      filter2cat,
      filterMap,
      filterState,
      uiStateActions,
    )

    // Remove if no children
    const catNameSet = new Set(sortedCategoryNames)
    sortedCategoryNames.forEach((cat) => {
      if (filterListMap[cat] === undefined) {
        catNameSet.delete(cat)
      }
    })

    sortedCategoryNames = [...catNameSet].sort()

    return (
      <List dense={true} style={{ margin: 0, padding: 0 }}>
        {sortedCategoryNames.map((categoryName, i) => (
          <div key={i}>
            <ListItem
              button
              onClick={(d) => this.handleExpand(d, categoryName)}
              style={{ background: '#EEEEEE' }}
            >
              <ListItemIcon>
                <ViewListIcon />
              </ListItemIcon>
              <ListItemText
                primary={categoryName.replace(/_/g, ' ')}
                style={{ fontSize: '1.2em' }}
              />
              {this.state.open ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={this.state[categoryName]} unmountOnExit>
              {filterListMap[categoryName]}
            </Collapse>
          </div>
        ))}
      </List>
    )
  }

  getExistingFilters = (
    allFilterNames,
    cat2filter,
    filter2cat,
    filterMap,
    filterState,
    uiStateActions,
  ) => {
    const newFilters = {}

    // All filters without parent categories will be here.
    newFilters[OTHERS_TAG] = []

    allFilterNames.forEach((filterName, idx) => {
      // Check this filter has parent category or not
      let categoryName = filter2cat[filterName]
      if (categoryName === undefined) {
        // This one does not have parent category
        const newFilterListItem = (
          <ListItem key={filterName}>
            {this.getFilter(
              idx,
              filterMap[filterName],
              filterState,
              uiStateActions,
            )}
          </ListItem>
        )

        const othersList = newFilters[OTHERS_TAG]
        othersList.push(newFilterListItem)
        newFilters[OTHERS_TAG] = othersList

        return
      }
      const filterSet = cat2filter[categoryName]

      if (filterSet.has(filterName)) {
        let listForCategory = newFilters[categoryName]

        if (listForCategory === undefined) {
          listForCategory = []
        }
        const filterListItem = (
          <ListItem key={filterName}>
            {this.getFilter(
              idx,
              filterMap[filterName],
              filterState,
              uiStateActions,
            )}
          </ListItem>
        )
        listForCategory.push(filterListItem)

        newFilters[categoryName] = listForCategory
      }
    })

    return newFilters
  }

  getFilter(idx, filter, filterState, uiStateActions) {
    if (filter === undefined) {
      return null
    }

    const networkData = this.props.networkData
    let currentSystem = null
    if (networkData !== undefined && networkData !== null) {
      currentSystem = networkData.name
    }

    const filterType = filter.type
    const defValue = Number((filter.max - filter.min) * 0.8)
    let enabled = false
    let color = getColor10(idx)
    if (idx === 0) {
      // For DDRAM edges (lemon yellow)
      color = '#FFF36D'
    }

    if (filterType === FILTER_TYPES.CONTINUOUS) {
      const name = filter.attributeName
      let value = defValue
      const currentState = filterState.get(name)

      if (currentState) {
        value = currentState.value
        enabled = currentState.enabled
      }

      return (
        <ContinuousFilter
          key={filter.attributeName}
          label={filter.attributeName}
          min={Number(filter.min)}
          max={Number(filter.max)}
          value={value}
          enabled={enabled}
          step={0.001}
          filtersActions={this.props.filtersActions}
          commandActions={this.props.commandActions}
          commands={this.props.commands}
          isPrimary={false}
          selected={this.state.selected}
          uiStateActions={uiStateActions}
          color={color}
          currentSystem={currentSystem}
        />
      )
    } else if (filterType === FILTER_TYPES.BOOLEAN) {
      return (
        <BooleanFilter
          key={filter.attributeName}
          label={filter.attributeName}
          enabled={enabled}
          filtersActions={this.props.filtersActions}
          commandActions={this.props.commandActions}
          selected={this.state.selected}
          color={color}
          uiStateActions={uiStateActions}
          currentSystem={currentSystem}
          tooltip={TOOLTIP_TEXTS.AP_MS}
        />
      )
    }
  }
}

export default withStyles(styles)(EdgeFilter)
