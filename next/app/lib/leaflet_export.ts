import type {
  ISymbolization,
  ISymbolizationCategorical,
  ISymbolizationRamp
} from 'types';

function sharedDataDrivenPreamble(
  symbolization: ISymbolizationRamp | ISymbolizationCategorical
) {
  return `const properties = feature.properties || {};
  const fallback = ${JSON.stringify(symbolization.defaultColor)};
  const property = ${JSON.stringify(symbolization.property)};
  const drivenValue = properties[property];`;
}

/**
 * Given a symbolization object, return JavaScript code for
 * Leaflet that replicates that style.
 */
export function leaflet(symbolization: ISymbolization) {
  const { simplestyle } = symbolization;

  function dataReturn({
    symbolization,
    color
  }: {
    symbolization: ISymbolization;
    color: boolean;
  }) {
    return `return {
    color: ${simplestyle ? `properties.stroke || ` : ''}${
      color ? `color || ` : ''
    }${JSON.stringify(symbolization.defaultColor)},
    weight: ${
      symbolization.simplestyle ? `properties['stroke-width'] || ` : ''
    }2,
    opacity: ${
      symbolization.simplestyle ? `properties['stroke-opacity'] || ` : ''
    }1,
    fillColor: ${symbolization.simplestyle ? `properties['fill'] || ` : ''}${
      color ? `color || ` : ''
    }${JSON.stringify(symbolization.defaultColor)},
    fillOpacity: ${
      symbolization.simplestyle ? `properties['fill-opacity'] || ` : ''
    }0.5,
  }`;
  }

  switch (symbolization.type) {
    case 'categorical': {
      return `function style(feature) {
  ${sharedDataDrivenPreamble(symbolization)}
  // Data-driven styles
  const ramp = ${JSON.stringify(
    Object.fromEntries(
      symbolization.stops.map((stop) => [stop.input, stop.output])
    ),
    null,
    2
  )};
  const color = ramp[drivenValue] || fallback;
  ${dataReturn({ symbolization, color: true })}
}`;
    }

    case 'ramp': {
      return `function style(feature) {
  ${sharedDataDrivenPreamble(symbolization)}

  const ramp = ${JSON.stringify(
    symbolization.stops.flatMap((stop) => [stop.input, stop.output]),
    null,
    2
  )};

  let color = fallback;
  for (let i = 0; i < ramp.length; i += 2) {
    if (drivenValue >= ramp[i]) {
      color = ramp[i + 1];
    }
  }
  
  ${dataReturn({ symbolization, color: true })}
}`;
    }
    case 'none': {
      return `function style(feature) {
  const properties = feature.properties || {};
  ${dataReturn({ symbolization, color: false })}
}`;
    }
  }
}
