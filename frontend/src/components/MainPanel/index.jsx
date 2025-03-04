import React, { useState } from 'react'

import Commands from '../Commands'
import MainMenuPanel from '../MainMenuPanel'
import LocalSearchPanel from '../LocalSearchPanel'
import BaseSplitPane from './BaseSplitPane'
import MessageBox from '../MessageBox'
import Tour from '../Tour'
import BrowserWarningDialog from './BrowserWarningDialog'

const CXTOOL_URL = 'https://35.203.154.74:3001/ndex2cyjs/'

/**
 *
 * Top-level component, used as a container of all sub panels
 *
 * @param props
 * @returns {*}
 * @constructor
 */
const MainPanel = props => {
  const {
    commandActions,
    uiState,
    uiStateActions,
    search,
    searchActions,
    network,
    selection,
    selectionActions,
    currentPath,
    renderingOptions,
    renderingOptionsActions,
    routeParams,
    location,
    localSearchActions,
    localSearch
  } = props

  const wrapperStyle = {
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
  }

  const [analysisPanelHeight, setAnalysisPanelHeightHelper] = useState(false)
  const setAnalysisPanelHeight = () => {
    setAnalysisPanelHeightHelper(!analysisPanelHeight)
  }

  return (
    <div style={wrapperStyle}>
      
      <BrowserWarningDialog />

      <MessageBox uiState={uiState} selection={selection} />

      <MainMenuPanel
        network={network.toJS()}
        uiState={uiState}
        uiStateActions={uiStateActions}
        maxEdgeCount={props.rawInteractions.get('maxEdgeCount')}
        rawInteractionsActions={props.rawInteractionsActions}
        renderingOptions={renderingOptions}
        renderingOptionsActions={renderingOptionsActions}
        setAnalysisPanelHeight={setAnalysisPanelHeight}
      />

      <BaseSplitPane cxtoolUrl={CXTOOL_URL} analysisPanelHeight={analysisPanelHeight} {...props} />

      {/* <Commands commandActions={commandActions} uiState={uiState} uiStateActions={uiStateActions} /> */}

      <LocalSearchPanel
        network={network.toJS()}
        commandActions={commandActions}
        searchActions={searchActions}
        selectionActions={selectionActions}
        search={search}
        currentPath={currentPath}
        uiState={uiState}
        uiStateActions={uiStateActions}
        routeParams={routeParams}
        renderingOptions={renderingOptions}
        renderingOptionsActions={renderingOptionsActions}
        location={location}
        localSearch={localSearch}
        localSearchActions={localSearchActions}
        cxUrl={CXTOOL_URL}
        selection={selection}
      />
    </div>
  )
}

export default MainPanel
