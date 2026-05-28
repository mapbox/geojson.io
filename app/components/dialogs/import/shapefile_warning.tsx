import { TextWell } from 'app/components/elements';
import type { ShapefileGroup } from 'app/lib/group_files';

export function ShapefileWarning({ file }: { file: ShapefileGroup }) {
  const warnings: React.ReactNode[] = [];
  if (!file.files.dbf) {
    warnings.push(
      <li key="missing-dbf">
        Missing DBF file: imported data will not include attributes.
      </li>
    );
  }
  if (!file.files.prj) {
    warnings.push(
      <li key="missing-prj">
        Missing PRJ file: imported geometry is assumed to be in EPSG:4326.
      </li>
    );
  }
  if (warnings.length) {
    return (
      <div className="pt-4">
        <TextWell variant="destructive">
          <ul>{warnings}</ul>
        </TextWell>
      </div>
    );
  }
  return null;
}
