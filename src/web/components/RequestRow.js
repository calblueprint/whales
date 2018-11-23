import React from "react";
import Moment from "react-moment";

const RequestRow = (props) => {
  return (
    <div
      className={`request__row ${props.selected ? "request__row--selected" : ""}`}
      onClick={() => props.onClick()}
    >
      <div className="request__meta">
        <div
          className={`status__circle ${Number(props.status) >= 400 
            ? "status__circle--error" : "status__circle--success"}`}
          style={{ marginRight: "10px" }}
        />
        <span
          style={{ fontWeight: 700, marginRight: "5px" }}
        >
          {props.method}
        </span>
        {props.url}
      </div>
      <div className="request__ts">
        <Moment interval={10000} fromNow>{props.time}</Moment>
      </div>
    </div>
  );
};

export default RequestRow;
