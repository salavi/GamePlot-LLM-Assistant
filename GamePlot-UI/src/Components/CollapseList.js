import React, { Component } from 'react';
import { MDBListGroup, MDBListGroupItem, MDBIcon, MDBCollapse, MDBTableBody, MDBTableHead, MDBTable } from 'mdb-react-ui-kit';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
class CollapseList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collapseItems: [],
      ctlNPCs: []
    };
  }

  addItems = (itemsToAdd) => {

    const updatedItems = this.state.collapseItems.map((existingItem) => {
    const newItemContent = itemsToAdd[existingItem.key];
    return newItemContent
      ? {
          ...existingItem,
          content: newItemContent,
          collapsed: false // Reset collapsed state when updating content
        }
      : existingItem;
  });

      Object.entries(itemsToAdd).forEach(([key, value]) => {
        if (!this.state.collapseItems.some((existingItem) => existingItem.key === key)) {
          const newItem = {
            id: key, // Use the unique key as the id
            key,
            head: key,
            content: value,
            collapsed: false
          };
          updatedItems.push(newItem);
        }
      });

      this.setState({ collapseItems: updatedItems });

 }

  toggleCollapse = (itemId) => {
    this.setState((prevState) => ({
      collapseItems: prevState.collapseItems.map((item) =>
        item.id === itemId ? { ...item, collapsed: !item.collapsed } : item
      )
    }));
  };

  removeItem = (itemId) => {
    this.setState((prevState) => ({
      collapseItems: prevState.collapseItems.filter((item) => item.id !== itemId)
    }));
  };

  // handleSwitchChange = (itemId) => {
  //   this.setState((prevState) => {
  //   const { ctlNPCs } = prevState;
  //   const itemIndex = ctlNPCs.indexOf(itemId);
  //
  //   let updatedCtlNPCs;
  //   if (itemIndex !== -1) {
  //     // If the itemId is already in ctlNPCs, remove it
  //     updatedCtlNPCs = ctlNPCs.filter((id) => id !== itemId);
  //   } else {
  //     // If the itemId is not in ctlNPCs, add it
  //     updatedCtlNPCs = [...ctlNPCs, itemId];
  //   }
  //
  //   return { ctlNPCs: updatedCtlNPCs };
  // });
  // }

  render() {
    const { collapseItems } = this.state;

    return (
      <div>
        {collapseItems.length > 0 ? (
          <MDBListGroup>
            {collapseItems.map((item) => (
              <MDBListGroupItem key={item.id}>
                <div className="d-flex justify-content-between align-items-center">
                  <div onClick={() => this.toggleCollapse(item.id)}>
                    {item.key} <MDBIcon icon={item.collapsed ? 'angle-down' : 'angle-up'} />
                  </div>
                  <FormControlLabel
                      value="start"
                      control={<Switch color="primary" />}
                      label="ctl"
                      labelPlacement="start"
                      size="small"
                      onChange={() => this.props.handleSwitchChange(item.id)}
                    />
                  {/*<button className="btn btn-danger" onClick={() => this.removeItem(item.id)}>*/}
                  {/*  <MDBIcon icon={'times'} />*/}
                  {/*</button>*/}
                </div>
                <MDBCollapse show={!item.collapsed}>

                  <table className="table table-borderless table-hover">

                  <tbody>
                      {item.content.map((contentItem, index) => (
                        <tr key={index}>
                          <td>{contentItem[0]}</td>
                          <td>{contentItem[1]}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>

                </MDBCollapse>
              </MDBListGroupItem>
            ))}
          </MDBListGroup>
        ) : (
          <div className={"text-center pt-3"}>No NPCs to display.</div>
        )}

      </div>
    );
  }
}

export default CollapseList;
