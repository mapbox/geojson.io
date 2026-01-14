import { CircleIcon } from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import { styledInlineA } from 'app/components/elements';

export function CircleTypesDialog() {
  return (
    <>
      <DialogHeader title="Circle types" titleIcon={CircleIcon} />
      <div>
        <p>
          geojson.io supports three different kinds of circles: Mercator,
          Geodesic, and Degrees. How are these different, and when might you
          want to use each of them?
        </p>
        <div className="font-bold pb-1 pt-4">Mercator circles</div>
        <i>A circle that looks like a circle</i>
        <p>
          These are circles that will <em>look like circles</em> on the map.
          They won't be ovals or semicircles: they’ll look like circles. This is
          because they’re drawn according to the{' '}
          <a
            href="https://en.wikipedia.org/wiki/Web_Mercator_projection"
            className={styledInlineA}
          >
            web mercator projection
          </a>
          . These circles will also look like circles on standard Mapbox,
          Google, and other kinds of web maps.
        </p>
        <p className="pt-2">
          Use this kind:{' '}
          <i>when you want a circle that looks like a circle on a web map.</i>
        </p>

        <div className="font-bold pb-1 pt-4">Geodesic circles</div>
        <i>A circle with a radius</i>
        <p>
          These are circles with real-world radiuses. You can draw a geodesic
          circle with a radius of "100 miles" or "1,000 meters" and it'll cover
          that geographical area. On a web mercator map, and on most other kinds
          of web maps, these circles will look elliptical, depending on where
          they're located.
        </p>
        <p className="pt-2">
          Use this kind:{' '}
          <i>when you want a circle with a real-world definition.</i>
        </p>

        <div className="font-bold pb-1 pt-4">Degree circles</div>
        <p>
          These are circles with radiuses set in degrees longitude & latitude
          units.
        </p>
        <p className="pt-2">
          Use this kind:{' '}
          <i>
            when you want a circle that looks circular on an equirectangular
            map, or if you’re trying to make a circle according to a decimal
            degrees measurement..
          </i>
        </p>
      </div>
    </>
  );
}
