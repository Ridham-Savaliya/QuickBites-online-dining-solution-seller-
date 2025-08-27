import { OAuth2Client } from 'google-auth-library';

const oauth2client = new OAuth2Client(
  import.meta.env.VITE_GOOGLE_CLIENT_ID,
  import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  import.meta.env.VITE_GOOGLE_REDIRECT_URI
);

export default oauth2client;
