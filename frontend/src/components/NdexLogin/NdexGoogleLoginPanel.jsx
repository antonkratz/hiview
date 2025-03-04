import React from 'react'
import GoogleLogin from 'react-google-login'
import GoogleLogo from './assets/images/google-logo.svg'
import GoogleLogoDisabled from './assets/images/google-logo-disabled.svg'
import config from './assets/config'
import { Button } from '@material-ui/core'
import HtmlTooltip from './HtmlTooltip'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles({
  googlePanel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

const NdexGoogleLoginPanel = props => {
  const classes = useStyles()

  // Unique ID for each NDEx server
  let googleSSO = true
  const serverUrl = props.ndexServer.split('//')[1]
  const clientId = config.G_CLIENT_ID[serverUrl]
  if (clientId === undefined || clientId === null) {
    googleSSO = false
  }

  const onFailure = err => {
    const message =
      (err.details &&
        err.details.startsWith(
          'Not a valid origin for the client: https://localhost:'
        )) ||
      (err.error && err['error']) ||
      JSON.stringify(err)
    props.onError(message, false)
  }

  const { onSuccess } = props

  const clsName = googleSSO
    ? 'google-sign-in-button'
    : 'google-sign-in-button googleButtonDisabled'
  const title = googleSSO
    ? 'Sign in with your Google account'
    : "Google Sign In is currently unavailable because the 'BLOCK THIRD-PARTY COOKIES' option is enabled in your web browser." +
      'To use the Google Sign In feature you can do one of two things:' +
      "1. Add 'accounts.google.com' to the list of websites allowed to write / read THIRD - PARTY COOKIES, or" +
      "2. Disable the 'BLOCK THIRD-PARTY COOKIES' option in your browser settings."

  const logo = googleSSO ? GoogleLogo : GoogleLogoDisabled

  return (
    <HtmlTooltip
      placement={'left'}
      disableFocusListener={googleSSO}
      disableHoverListener={googleSSO}
      title={
        <React.Fragment>
          <Typography variant={'subtitle1'} color={'inherit'}>
            Currently this feature is only available for test and public servers
          </Typography>
          <Typography variant={'body1'}>
            {'Server selected: ' + props.ndexServer}
          </Typography>
        </React.Fragment>
      }
    >
      <div className={classes.googlePanel}>
        <GoogleLogin
          clientId={clientId}
          render={renderProps => (
            <Button
              id="googleSignInButtonId"
              disabled={!googleSSO}
              className={clsName}
              title={title}
              onClick={renderProps.onClick}
            >
              <span className="google-sign-in-button-span">
                <img src={logo} alt="" className="googleLogo" />
                <div className="googleSignInText">Sign in with Google</div>
              </span>
            </Button>
          )}
          buttonText="Login"
          onSuccess={onSuccess}
          onFailure={onFailure}
        />
      </div>
    </HtmlTooltip>
  )
}

export default NdexGoogleLoginPanel
