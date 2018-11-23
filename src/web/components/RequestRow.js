import React from "react";
import Moment from "react-moment";

const truncate = (str) => {
  if (str.length > 25) {
    return `${str.substring(0, 25)}...`;
  }
  return str;
}

class RequestRow extends React.PureComponent {
  constructor(props) {
    super(props);
    this.date = new Date();
  }

  render() {
    const { props } = this;
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
          {truncate(props.url)}
        </div>
        <div className="request__ts">
          <Moment interval={10000} fromNow>
            {this.date}
          </Moment>
        </div>
      </div>
    );
  }
};

export default RequestRow;
