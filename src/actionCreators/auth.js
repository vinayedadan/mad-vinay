import API from "../api";
import get from "lodash/get";
import { identify, track } from "../util/tracker";
import { cleanPin, checkMinimumBalance } from "../util";
import { restartResponders, redirectTo } from "../router";
import axios from "axios";
import { addAlertAction } from "./alerts";
import { saveTransactionDetailsAction } from './selling';
import { push, history } from "react-router-redux";

import { apiUrl as url } from '../../src/config/api';









export const STATUSES = {
  PENDING: "PENDING",
  LOGIN_READY: "LOGIN_READY",
  LOGGED_IN: "LOGGED_IN",
  REQUEST_OTP: "REQUEST_OTP",
  REQUESTED_OTP: "REQUESTED_OTP",
  CACHED_LOGIN: "CACHED_LOGIN",
  START_SCREEN: "START_SCREEN"
};

export const CHANGE_AUTH_STATUS_ACTION = "auth/CHANGE_AUTH_STATUS";
export const UPDATE_REQUEST_OTP_PHONE_ACTION = "auth/UPDATE_REQUEST_OTP_PHONE";
export const REQUEST_OTP_ACTION = "auth/REQUEST_OTP";
export const UPDATE_OTP_CODE_ACTION = "auth/UPDATE_OTP_CODE";
export const UPDATE_POS_DMSID_ACTION = "auth/UPDATE_POS_DMSID";
export const UPDATE_POS_PIN_ACTION = "auth/UPDATE_POS_PIN";
export const LOGOUT_ACTION = "auth/LOGOUT";
export const UPDATE_BALANCE_ACTION = "auth/UPDATE_BALANCE";
export const UPDATE_OLD_PIN_ACTION = "auth/UPDATE_OLD_PIN";
export const UPDATE_NEW_PIN_ACTION = "auth/UPDATE_NEW_PIN";
export const CLEAR_CHANGE_PIN_ACTION = "auth/CLEAR_CHANGE_PIN";
export const UPDATE_BALANCE_EPIN_POPUP_ACTION = "auth/UPDATE_BALANCE_EPIN_POPUP";
export const UPDATE_BALANCE_EPIN_ACTION = "auth/UPDATE_BALANCE_EPIN";
export const DMSID_FETCHED_ACTION = "auth/DMSID_FETCHED";
export const CLEAR_PIN_ACTION = "auth/CLEAR_PIN";
export const UPDATE_THRESHOLD_ACTION = "auth/UPDATE_THRESHOLD_ACTION";
export const DISPLAY_START_SCREEN = "START_SCREEN";
export const SET_DATA_SUCCESS = "SET_DATA_SUCCESS";
export const SET_PARTIALLY_FAILED = "SET_PARTIALLY_FAILED";
export const SET_DATA_FAILED = "SET_DATA_FAILED";
export const SET_PROCESSING_STATUS = 'SET_PROCESSING_STATUS';

export const UPDATE_DATA = 'UPDATE_DATA'




export const loginUserAction = payload => {
  return {
    type: CHANGE_AUTH_STATUS_ACTION,
    payload: { ...payload, status: STATUSES.PENDING }
  };
};

export const loginReadyUserAction = payload => {
  axios.defaults.headers.common["Authorization"] =
    "Bearer " + payload.token.access_token;
  return {
    type: CHANGE_AUTH_STATUS_ACTION,
    payload: { ...payload, status: STATUSES.LOGIN_READY }
  };
};

export const cachedLoggedinAction = (token, cachedLogin) => {
  axios.defaults.headers.common["Authorization"] =
    "Bearer " + token.access_token;
  return {
    type: CHANGE_AUTH_STATUS_ACTION,
    payload: {
      token,
      dmsid: cachedLogin.req.dmsId,
      pin: cachedLogin.req.pin,
      login: cachedLogin.res,
      status: STATUSES.LOGGED_IN
    }
  };
};

export const loggedinAction = payload => {
  return {
    type: CHANGE_AUTH_STATUS_ACTION,
    payload: { ...payload, status: STATUSES.LOGGED_IN }
  };
};

// export const requestOtpAction = (e) => {
//   debugger
//   return dispatch => {
    
//     dispatch({type: "l"});
//   }
// }


export const requestOtpAction = payload => {
  return {
    type: CHANGE_AUTH_STATUS_ACTION,
    payload: { ...payload, status: STATUSES.REQUEST_OTP }
  };
};

export const requestedOtpAction = payload => {
  return {
    type: CHANGE_AUTH_STATUS_ACTION,
    payload: { ...payload, status: STATUSES.REQUESTED_OTP }
  };
};

export const updateRequestOTPPhoneAction = phoneNumber => {
  // debugger
  return {
    type: UPDATE_REQUEST_OTP_PHONE_ACTION,
    payload: { phoneNumber }
  };
};

export const updateOTPCodeAction = otpCode => {
  return {
    type: UPDATE_OTP_CODE_ACTION,
    payload: { otpCode }
  };
};

export const updatePosDMSIDAction = dmsid => {
  return {
    type: UPDATE_POS_DMSID_ACTION,
    payload: { dmsid }
  };
};

export const updatePosPinAction = pin => {
  return {
    type: UPDATE_POS_PIN_ACTION,
    payload: { pin }
  };
};

export const updateBalanceAction = payload => {
  return {
    type: UPDATE_BALANCE_ACTION,
    payload
  };
};

export const updateOldPinAction = pin => {
  return {
    type: UPDATE_OLD_PIN_ACTION,
    payload: { pin }
  };
};

export const updateNewPinAction = pin => {
  return {
    type: UPDATE_NEW_PIN_ACTION,
    payload: { pin }
  };
};

export const clearChangePinAction = pin => {
  return {
    type: CLEAR_CHANGE_PIN_ACTION
  };
};

export const clearPinAction = () => {
  return { type: CLEAR_PIN_ACTION };
};

export const dmsidFetchedAction = data => {
  return {
    type: DMSID_FETCHED_ACTION,
    payload: data
  };
};

export const updateThresholdAction = payload => {
  return {
    type: UPDATE_THRESHOLD_ACTION,
    payload
  };
};

const autoLogout = (dispatch, getState) => {
  let __timeout;
  const check = () => {
    const state = getState();
    const expiresAt = get(state, "auth.login.expiresAt") || Date.now() + 10;
    if (expiresAt < Date.now()) {
      const msisdn = get(state, "auth.token.msisdn");
      const dmsid = get(state, "auth.token.dmsid");
      track("User session expired", {
        input_msisdn: msisdn,
        input_DMSID: dmsid
      });
      dispatch(logoutAction());
      clearTimeout(__timeout);
    } else {
      __timeout = setTimeout(check, 10000);
    }
  };
  check();
};

export const requestOTPAction = () => {
  
  return (dispatch, getState) => {
    const phoneNumber = get(getState(), "auth.otpRequestPhoneNumber");

    API.requestOTP({ phoneNumber }).then(
      result => {
        
        const error = get(result, "error_description");
        
        if (error) {
          dispatch(addAlertAction("error", error));
        } else {
          dispatch(requestedOtpAction({ otp: result }));
          
      //dispatch(push("/EnterOTP"));
        }
      },
      err => {
        const error = get(err, "response.data.error_description");
        dispatch(addAlertAction("error", error));
      }
    );
  };
};

export const validateOTPCodeAction = () => {
  return (dispatch, getState) => {
    const state = getState();
    const smsPassword = get(state, "auth.otpCode");
    const msisdn = get(state, "auth.otpRequestPhoneNumber");
    API.validateOTP({ smsPassword, msisdn }).then(({ error, code }) => {
      if (error) {
        track("MSISDN Identification Failed", {
          reason: error,
          input_msisdn: msisdn
        });
        return dispatch(addAlertAction("error", error));
      }
      return API.authPOSWithCode({ code }).then(tokenData => {
        identify(get(tokenData, "msisdn"), {
          country: get(tokenData, "country")
        });

        const cachedLogin = tokenData.__cached;

        if (cachedLogin) {
          const dmsid = get(cachedLogin, "req.dmsId");

          delete tokenData.__cached;
          dispatch(cachedLoggedinAction(tokenData, cachedLogin));
          dispatch(requestBalanceAction());
          autoLogout(dispatch, getState);

          API.getDmsidData({ dmsid }).then(data => {
            dispatch(dmsidFetchedAction(data));
          });
        } else {
          dispatch(loginReadyUserAction({ token: tokenData }));
        }
      });
    });
  };
};

export const getBalanceAction = (exportData) => {
  return async (dispatch, getState) => {
    const state = getState();
    const pin = get(state, "auth.pin");
    const msisdn = get(state, "auth.token.msisdn");
    const currentBalance = get(state, "auth.balance.balance");


    
    try {
      let data = await API.fetchThresholdValue(msisdn);
      dispatch(fetchThresholdValue(data.low_balance));
    }catch(err){

    }
    
    const newState = getState();

    if (pin && msisdn) {
      API.getBalance({ pin, msisdn, currentBalance }).then(
        balanceData => {
          if (exportData) {
            exportData.pos_balance = balanceData.balance;
            dispatch(saveTransactionDetailsAction(exportData))
          }
          const threshold = get(newState, "auth.threshold");
          const isLow = checkMinimumBalance(balanceData.balance, threshold);

          balanceData.receivedAt = Date.now();

          identify(msisdn, { balance_available: get(balanceData, "balance") });
          dispatch(updateBalanceAction({ balance: balanceData }));
          if (isLow) {
            dispatch(
              addAlertAction(
                "warning",
                "Tu saldo disponible es muy bajo. No olvides recargar para seguir vendiendo!"
              )
            );
          }
        },
        () => {
          dispatch(clearPinAction());
          dispatch(toggleBalanceEpinPopup(true));
        }
      );
    }
  };
};

export const toggleBalanceEpinPopup = (open = false) => {
  return {
    type: UPDATE_BALANCE_EPIN_POPUP_ACTION,
    payload: { balanceEpinOpen: open }
  };
};

export const updateBalanceEpin = epin => {
  return {
    type: UPDATE_BALANCE_EPIN_ACTION,
    payload: { pin: cleanPin(epin) }
  };
};

export const requestBalanceAction = () => {
  return (dispatch, getState) => {
    const state = getState();
    const epin = get(state, "auth.pin");
    if (epin) {
      dispatch(getBalanceAction());
    } else {
      dispatch(toggleBalanceEpinPopup(true));
    }
  };
};

export const loginAction = () => {
  return (dispatch, getState) => {
    
    const state = getState();
    const { dmsid, pin } = get(state, "auth");
    const msisdn = get(state, "auth.token.msisdn");
    const page = get(state, "route.data.page");

    API.login({ dmsid, pin, msisdn }).then(
       loginData => {
         debugger
        identify(msisdn, {
          distributorId: get(loginData, "distributor"),
          seller: get(loginData, "seller"),
          pos_msisdn: msisdn,
          id: dmsid
        });
        API.getDmsidData({ dmsid }).then(data => {
          dispatch(dmsidFetchedAction(data));
        });
        dispatch(loggedinAction({ login: loginData }));
        dispatch(requestBalanceAction());
        autoLogout(dispatch, getState);
        // if ("MainMenu" !== page) {
        //   redirectTo({ page: "MainMenu" });
        // } else {
        //   restartResponders();
        // }
      },
      err => {
        const error = get(err, "response.data.error.description");
        dispatch(addAlertAction("error", error));
      }
    );
  };
};

export const logoutAction = () => {
  return (dispatch, getState) => {
    const state = getState();
    const msisdn = get(state, "auth.token.msisdn");
    API.logout({ msisdn });
    track("User Logout");
    dispatch({ type: LOGOUT_ACTION });
    redirectTo({ page: "MainMenu" });
  };
};

export const changePinAction = () => {
  return (dispatch, getState) => {
    const state = getState();
    const pin = get(state, "auth.pinChange.old");
    const newPin = get(state, "auth.pinChange.new");
    const msisdn = get(state, "auth.token.msisdn");
    const dmsid = get(state, "auth.dmsid");

    API.changePin({ pin, newPin, msisdn, dmsid }).then(
      () => {
        dispatch(addAlertAction("success", "El PIN se cambió con éxito."));
        dispatch({ type: LOGOUT_ACTION });
        redirectTo({ page: "Login" });
      },
      e => {
        const errorMessage =
          get(e, "response.data.error.message") ||
          "NO SE HA COMPLETADO EL CAMBIO";
        dispatch(addAlertAction("error", errorMessage));
      }
    );
  };
};

export const fetchThresholdValue = (threshold) => {
  return (dispatch) => dispatch(updateThresholdAction({ threshold: threshold }));
}

export const displayStartScreen = () => {
  return {
    type: DISPLAY_START_SCREEN
  }
}











export const getFrontIdDetails = (data) => {
 debugger;
  return (dispatch) =>  {
  //  dispatch(setProcessingStatus())
   axios({
      method: 'post',
      url,
      data,
      config: {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        }
      }
    }).then(data => {
      // const Payload = JSON.parse(data.data.Payload);
      const Payload = data.data.Payload;
      debugger
      if (Payload.errorMessage) {
        dispatch(setDataFailed(Payload.errorMessage));
      } else {
        if (!Payload.idno || !Payload.name || !Payload.dob) {
          dispatch(setDataPartiallyFailed({
            data: {
              frontData: {
                number: Payload.idno,
                surname: Payload.name,
                dob: Payload.dob,
              }
            },
            message:
              'No se detectan todos los campos. Por favor intente una vez más o ingrese los valores en el campo'
          }));
        } else {
          dispatch(setDataSuccess({
            frontData: {
              number: Payload.idno,
              surname: Payload.name,
              dob: Payload.dob,
            }
          }));
        }
      }
    }).catch(({ message }) => {
      debugger
      dispatch(setDataFailed(message));
    })

  }
  
};

export const setDataSuccess = data => {
  return {
    type: SET_DATA_SUCCESS,
    payload: data
  };
};
export const setDataFailed = data => {
  return {
    type: SET_DATA_FAILED,
    payload: data
  };
};
export const setDataPartiallyFailed = data => {
  return {
    type: SET_PARTIALLY_FAILED,
    payload: data
  };
};

export const setProcessingStatus =  () => {
  return {
    type: SET_PROCESSING_STATUS
  }
};

export const updateData =  (data) => {
  return {
    type: UPDATE_DATA,
    payload: data
  }
};