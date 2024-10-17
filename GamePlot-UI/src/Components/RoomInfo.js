import React from 'react';
import { MDBTypography } from 'mdb-react-ui-kit';

const RoomInfo = ({ roomNumber, roomPass, username }) => {
  return (
    <div className="d-flex justify-content-center">
      <div className="me-2">
        <MDBTypography tag="h6" className="mb-0">
          User Name:
        </MDBTypography>
        <MDBTypography tag="p" className="mb-0">
          {username}
        </MDBTypography>
      </div>
      <div className="me-2">
        <MDBTypography tag="h6" className="mb-0">
          Room Number:
        </MDBTypography>
        <MDBTypography tag="p" className="mb-0">
          {roomNumber}
        </MDBTypography>
      </div>
      <div>
        <MDBTypography tag="h6" className="mb-0">
          Room Pass:
        </MDBTypography>
        <MDBTypography tag="p" className="mb-0">
          {roomPass}
        </MDBTypography>
      </div>
    </div>
  );
};

export default RoomInfo;
