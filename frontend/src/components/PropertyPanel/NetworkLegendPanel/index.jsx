import React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import { Paper } from '@material-ui/core'

import NodeLegend from './NodeLegend'
import EdgeLegend from './EdgeLegend'

const useStyles = makeStyles((theme) => ({
  root: {
    width: '30em',
    height: '50em',
    overflowY: 'scroll',
    overflowX: 'hidden',
    padding: theme.spacing(1),
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 9999,
  },
}))

const NetworkLegendPanel = ({
  legend,
  showLegend,
  setShowLegend,
  nodeStyle,
}) => {
  const classes = useStyles()

  const handleClick = () => {
    setShowLegend(false)
  }

  if (!showLegend) {
    return null
  }

  return (
    <Paper className={classes.root} variant="outlined" onClick={handleClick}>
      <NodeLegend legend={legend} nodeStyle={nodeStyle} />
      <EdgeLegend legend={legend} />
    </Paper>
  )
}

export default NetworkLegendPanel
