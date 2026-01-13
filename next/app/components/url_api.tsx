import { MapContext } from 'app/context/map_context';
import { useImportFile, useImportString } from 'app/hooks/use_import';
import { DEFAULT_IMPORT_OPTIONS, detectType } from 'app/lib/convert';
import { useSetAtom } from 'jotai';
import { useCallback, useContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { dialogAtom } from 'state/jotai';
import { match } from 'ts-pattern';
import { useSearchParams } from 'wouter';
import { useZoomTo } from 'app/hooks/use_zoom_to';
import { getExtent } from 'app/lib/geometry';

export function UrlAPI() {
  const doImportString = useImportString();
  const setDialogState = useSetAtom(dialogAtom);
  const doImportFile = useImportFile();
  const [searchParams] = useSearchParams();
  const data = searchParams?.get('data');
  const id = searchParams?.get('id');
  const gist = searchParams?.get('gist');
  const done = useRef<boolean>(false);
  const zoomTo = useZoomTo();
  const map = useContext(MapContext); // get map instance

  // Helper to import GeoJSON string
  const importGeoJSONString = useCallback(
    (geojson: string, name = 'Imported GeoJSON') => {
      doImportString(
        geojson,
        {
          ...DEFAULT_IMPORT_OPTIONS,
          type: 'geojson'
        },
        () => {},
        name
      );
    },
    [doImportString]
  );

  const getExtentAndZoomTo = useCallback(
    (geojson: any) => {
      const parsed = JSON.parse(geojson);
      const maybeExtent = getExtent(parsed);
      zoomTo(maybeExtent);
    },
    [zoomTo]
  );

  useEffect(() => {
    if (done.current) return;
    if (!map) return; // Wait for map to be available

    // Helper to fetch and import from a URL
    const fetchAndImport = async (url: string, name?: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
      const text = await res.text();
      importGeoJSONString(text, name);
      getExtentAndZoomTo(text);
    };

    // Handle id param (gist: or github:)
    const handleIdParam = async (idVal: string) => {
      if (idVal.startsWith('gist:')) {
        // id=gist:username/gistid
        const parts = idVal.replace('gist:', '').split('/');
        if (parts.length < 2) throw new Error('Invalid gist id format');
        const username = parts[0];
        const gistid = parts[1];
        // Gist API: https://api.github.com/gists/gistid
        const apiUrl = `https://api.github.com/gists/${gistid}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Failed to fetch gist');
        const gistData = await res.json();
        // Find first .geojson file
        const fileEntry = Object.values(gistData.files).find((f: any) =>
          f.filename.endsWith('.geojson')
        ) as any;
        if (!fileEntry) throw new Error('No .geojson file found in gist');
        const rawUrl = fileEntry.raw_url;
        await fetchAndImport(rawUrl, fileEntry.filename);
      } else if (idVal.startsWith('github:')) {
        // id=github:username/repo/branch/path/to/file.geojson or id=github:username/repo/blob/branch/path/to/file.geojson
        const path = idVal.replace('github:', '');
        // Handle possible 'blob/' in the path
        let username, repo, branch, filePath;
        if (path.includes('/blob/')) {
          // e.g. benbalter/dc-wifi-social/blob/master/bars.geojson
          const [user, repository, , ...rest] = path.split('/');
          username = user;
          repo = repository;
          branch = rest[0];
          filePath = rest.slice(1).join('/');
          // Use refs/heads/ for branch in raw URL
          const rawUrl = `https://raw.githubusercontent.com/${username}/${repo}/refs/heads/${branch}/${filePath}`;
          await fetchAndImport(rawUrl, filePath);
        } else {
          // username/repo/branch/path/to/file.geojson
          const [user, repository, branchName, ...filePathParts] =
            path.split('/');
          username = user;
          repo = repository;
          branch = branchName;
          filePath = filePathParts.join('/');
          const rawUrl = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${filePath}`;
          await fetchAndImport(rawUrl, filePathParts[filePathParts.length - 1]);
        }
      } else {
        throw new Error('Unknown id format');
      }
    };

    // Handle data param (URL or data URL)
    const handleDataParam = async (data: string) => {
      const url = new URL(data);
      if (url.protocol === 'https:') {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const file = new File([buffer], url.pathname.split('/').pop() || '', {
          type: res.headers.get('Content-Type') || ''
        });
        const options = (await detectType(file)).unsafeCoerce();
        doImportFile(file, options, () => {});

        // Convert buffer to JSON for extent/zoom
        const text = new TextDecoder().decode(buffer);
        getExtentAndZoomTo(text);
      } else if (url.protocol === 'data:') {
        const [description, ...parts] = url.pathname.split(',');
        const data = parts.join(',');
        const [type, encoding] = description.split(';', 2) as [
          string,
          string | undefined
        ];

        const decoded = match(encoding)
          .with(undefined, () => decodeURIComponent(data))
          .with('base64', () => atob(data))
          .otherwise(() => {
            throw new Error('Unknown encoding in data url');
          });

        if (type === 'application/json') {
          doImportString(
            decoded,
            {
              ...DEFAULT_IMPORT_OPTIONS,
              type: 'geojson'
            },
            () => {}
          );

          getExtentAndZoomTo(decoded);
        }
      } else {
        toast.error(
          'Couldn’t handle this ?load argument - urls and data urls are supported'
        );
      }
    };

    (async () => {
      try {
        if (data) {
          done.current = true;
          await handleDataParam(data);
        } else if (id) {
          done.current = true;
          await handleIdParam(id);
        }
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : 'Failed to load data from URL'
        );
      }
    })();
    // Add map as a dependency
  }, [
    data,
    id,
    map,
    doImportString,
    doImportFile,
    setDialogState,
    zoomTo,
    getExtentAndZoomTo,
    importGeoJSONString
  ]);

  return null;
}
