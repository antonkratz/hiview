import React, {Component, PropTypes} from 'react'

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

class PropListPanel extends Component {

  render() {
    let properties = this.props.data
    const keys = Object.keys(properties)
    console.log('------- keys -----------')
    console.log(keys)
    const filtered = keys.filter(key => {
      return (!key.startsWith('_'))
    })

    return (
      <List>
        {this.renderList(filtered, properties)}
      </List>
    )
  }

  renderList = (keys, properties) => {
    return (keys.map((p, i) => {

      const val = properties[p]

      if (typeof val === 'object') {
        return (this.expandObject(i, p, val))
      } else {
        return (<ListItem key={i} hoverColor={'#80CBC4'} primaryTogglesNestedList={true} primaryText={properties[p]} secondaryText={p}/>)
      }
    }))
  }

  expandObject = (idx, key, objectEntry) => {
    const keys = Object.keys(objectEntry)

    return (<ListItem key={idx} hoverColor={'#80CBC4'} primaryTogglesNestedList={true} primaryText={key} nestedItems={[this.getList(keys, objectEntry)]}/>)
  }

  getList = (keys, objectEntry) => {

    return keys.map((p, i) => {
      const val = objectEntry[p]

      if (typeof val === 'object') {
        return this.expandObject(i, p, val)
      } else {
        return (<ListItem key={i} hoverColor={'#80CBC4'} primaryTogglesNestedList={true} primaryText={objectEntry[p]} secondaryText={p}/>)
      }
    })
  }

  _handleTouchTap = id => {
    window.open('https://www.yeastgenome.org/locus/' + id);
  }

}

export default PropListPanel
