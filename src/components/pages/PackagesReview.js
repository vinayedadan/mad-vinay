import React, { Component } from "react";
import PageTitle from "../components/PageTitle";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import { redirectTo } from "../../router";
import Divider from "material-ui/Divider";
import { connect } from "react-redux";
import { siteTree } from "../../siteTree";
import get from "lodash/get";
import _ from 'lodash';
import {
  sellPackageAction,
  sellPendingAction
} from "../../actionCreators/selling";
import { getPackageById, formatPhoneNumber } from "../../util/index";
import { track } from "../../util/tracker";
import PinDialog from "../components/PinDialog";
import { updatePosPinAction } from "../../actionCreators/auth.js";

const ConnectedPinDialog = connect(
  state => {
    return {
      open: !!get(state, "pendingSale"),
      pin: get(state, "auth.pin") || ""
    };
  },
  (dispatch, ownProps) => {
    return {
      onPinChange: (e, value) => dispatch(updatePosPinAction(value)),
      handleClose: () => {
        dispatch({ type: "pendingSale/CLEAR" });
        redirectTo(
          { page: "PackagesPacks", category: ownProps.category },
          true
        );
      },
      handleMainAction: () => dispatch(sellPendingAction())
    };
  }
)(PinDialog);

export class PackagesReview extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isButtonDisabled : false
    }
    this.PackagesReviewHandler = this.PackagesReviewHandler.bind(this);
    this.clickCount = 0;
  }

  PackagesReviewHandler = _.debounce(() => {
    this.props.sell(this.props.trackableData.confirm);
  }, 500)

  componentWillReceiveProps(nextProps) {
    if(nextProps.submitStatus!== this.props.submitStatus){
      console.log("Entered  componentWillReceiveProps ------------->>>>>",nextProps.submitStatus)
      this.setState({isButtonDisabled: nextProps.submitStatus})
    }
  }

  componentWillUnmount(){
    this.clickCount = 0;
  }

  onClickBtn = () =>{
  console.log("Clicked on Package button")
  this.clickCount++;
  console.log('Click count', this.clickCount);
  if(this.clickCount === 1) {
    console.log('This should come only once. Otherwise shows multiple API calls')
    this.PackagesReviewHandler(); 
  }
  }


  render() {
    return (
      <PageTitle
        page="PackagesReview"
        backParams={{
          page: "PackagesPacks",
          category: this.props.package.category
        }}
      >
        <div className="max-width-4 mx-auto">
          <div className="center">
            <h1 className="text-primary regular h5 p0 my2">
              Confirma tu transacción:
            </h1>
            <Divider />

            <h2 className="h6 regular text-tertiary p0 mt2 mb0">Paquete</h2>
            <h3 className="regular h5 text-primary p0 m0">
              {this.props.package.name}
            </h3>
            <h3 className="regular h5 text-tertiary  p0 m0">
              {this.props.package.description}
            </h3>

            <h2 className="h6 regular text-tertiary p0 mt2 mb0">Valor</h2>
            <h3 className="regular h1 text-primary p0 m0">
              {this.props.package.currency}
              {this.props.package.displayPrice}
            </h3>

            <h2 className="h6 regular text-tertiary p0 mt2 mb0">
              Teléfono del usuario
            </h2>
            <h3 className="regular h1 text-primary p0 m0 mb2">
              {this.props.clientPhoneNumber}
            </h3>

            <Divider />
            <br />
            <br />
            <RaisedButton
              id="comprar"
              ref={(refs)=>{this.btnRef = refs}}
              secondary={true}
              label="Comprar"
              disabled={this.props.submitStatus}
              disabledBackgroundColor="#CAF1F6"
              disabledLabelColor="#FFF"
              onClick={() => {
                this.onClickBtn()
                // this.btnRef.button.setAttribute("disabled",true);
                // this.setState({isButtonDisabled: true},()=>{
                //   this.PackagesReviewHandler();
                // });
              }}
            />
            <br />
            <br />
            <FlatButton
              secondary={true}
              label="Editar"
              onClick={() => {
                track("Order Cancelled", this.props.trackableData.cancel);
                redirectTo({
                  page: "PackagesPacks",
                  category: this.props.package.category
                });
              }}
            />
          </div>
          <ConnectedPinDialog category={this.props.package.category} />
        </div>
      </PageTitle>
    );
  }
}

export default connect(
  state => {
    const pack = getPackageById(state, get(state, "route.id"));
    const clientPhoneNumber = formatPhoneNumber(
      get(state, "clientPhone.phoneNumber")
    );
    const submitStatus = get(state, "buttonState.isSubmitting");

    const cancelTrackableData = {
      revenue: pack.price,
      payment_method: "BALANCE",
      products: [
        {
          name: pack.name,
          variant: "PACKAGE",
          price: pack.price,
          quantity: 1,
          currency: pack.currency,
          category: pack.category,
          brand: "Tigo PoS Guatemala",
          product_id: pack.productId
        }
      ]
    };

    const confirmTrackableData = {
      revenue: pack.price,
      payment_method: "BALANCE",
      products: [
        {
          name: pack.name,
          variant: "PACKAGE",
          price: pack.price,
          quantity: 1,
          currency: pack.currency,
          category: pack.category,
          brand: "Tigo PoS Guatemala",
          product_id: pack.productId
        }
      ],
      store: {
        address: get(state, "auth.dmsidData.storeAddress"),
        department: get(state, "auth.dmsidData.storeDepartment"),
        province: get(state, "auth.dmsidData.storeProvince"),
        longitude: get(state, "auth.dmsidData.storeLongitud"),
        latitude: get(state, "auth.dmsidData.storeLatitud")
      }
    };

    return {
      pageName: siteTree.PackagesReview.name,
      clientPhoneNumber,
      submitStatus,
      package: pack,
      trackableData: {
        cancel: cancelTrackableData,
        confirm: confirmTrackableData
      }
    };
  },
  dispatch => {
    return {
      sell: trackableData => dispatch(sellPackageAction(trackableData))
    };
  }
)(PackagesReview);

