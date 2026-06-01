import { TextWell } from 'app/components/elements';
import {
  FILE_LIMIT_BYTES,
  FILE_LIMIT_MB,
  FILE_WARN_BYTES,
  FILE_WARN_MB
} from 'app/lib/constants';
import type { FileGroup, ShapefileGroup } from 'app/lib/group_files';
import { usePersistence } from 'app/lib/persistence/context';

function getFileSize(file: FileGroup | ShapefileGroup) {
  switch (file.type) {
    case 'file': {
      return file.file.size;
    }
    case 'shapefile': {
      return (file.files.shp?.size || 0) + (file.files.dbf?.size || 0);
    }
  }
}

export function FileWarning({
  file,
  children
}: React.PropsWithChildren<{
  file: FileGroup | ShapefileGroup;
}>) {
  const rep = usePersistence();
  const [meta] = rep.useMetadata();

  const size = getFileSize(file);

  const result =
    size > FILE_LIMIT_BYTES ? 'block' : size > FILE_WARN_BYTES ? 'warn' : 'ok';

  if (meta.type === 'memory') {
    return <div>{children}</div>;
  }

  switch (result) {
    case 'ok':
      return <div>{children}</div>;
    case 'warn': {
      return (
        <>
          <div className="pt-4 pb-2">
            <TextWell>
              This file exceeds the soft limit of {FILE_WARN_MB}MB. You may
              notice decreased performance.
            </TextWell>
          </div>
          {children}
        </>
      );
    }
    case 'block': {
      return (
        <div className="pt-4">
          <TextWell variant="destructive">
            This file exceeds the hard limit of {FILE_LIMIT_MB}MB and can’t be
            imported.
          </TextWell>
        </div>
      );
    }
  }
}
