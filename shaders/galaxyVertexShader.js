export default /* glsl */ `
uniform float uTime;
uniform float uSize;

varying vec3 vColor;

attribute float aScale;
attribute vec3 aRandomness;

void main() {
  /**
   * Update varying
   */
  vColor = color;

  /**
   * Update position
   */

  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  //spin 
  float angle = atan(modelPosition.x, modelPosition.z);
  float distanceToCenter = length(modelPosition.xz);
  float angleOffset = (1.0 / distanceToCenter) * uTime * 0.5;
  angle += angleOffset;
  modelPosition.x = cos(angle) * distanceToCenter;
  modelPosition.z = sin(angle) * distanceToCenter;

  // randomness
  modelPosition.xyz += aRandomness;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPosition = projectionMatrix * viewPosition;
  gl_Position = projectionPosition;

  /**
     * Size
     */
  gl_PointSize = uSize * aScale;
  gl_PointSize *= (1.0 / - viewPosition.z);

}
`;
