(function(window) {
  window['env'] = window['env'] || {};

  // Default values - will be replaced by envsubst in production
  window['env']['apiUrl'] = '${API_URL:-/api/v1}';
  window['env']['keycloakUrl'] = '${KEYCLOAK_URL:-http://keycloak:8080}';
  window['env']['keycloakRealm'] = '${KEYCLOAK_REALM:-basis-realm}';
  window['env']['keycloakClientId'] = '${KEYCLOAK_CLIENT_ID:-basis-frontend}';
  window['env']['appUrl'] = '${APP_URL:-http://localhost}';
  window['env']['swaggerUrl'] = '${SWAGGER_URL:-/swagger-ui.html}';
})(this);