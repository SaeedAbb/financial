// This file is used for runtime configuration replacement in production builds
// It gets replaced with actual values during Docker container startup

(function(window) {
  window['env'] = window['env'] || {};

  // Environment variables
  window['env']['apiUrl'] = '${API_URL}';
  window['env']['keycloakUrl'] = '${KEYCLOAK_URL}';
  window['env']['keycloakRealm'] = '${KEYCLOAK_REALM}';
  window['env']['keycloakClientId'] = '${KEYCLOAK_CLIENT_ID}';
  window['env']['appUrl'] = '${APP_URL}';
  window['env']['swaggerUrl'] = '${SWAGGER_URL}';
})(this);