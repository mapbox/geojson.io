import { describe, expect, it } from 'vitest';

import {
  CMomentLog,
  EMPTY_MOMENT,
  fMoment,
  UMoment,
  UMomentLog
} from './moment';

describe('fMoment', () => {
  it('generates a moment', () => {
    expect(fMoment('This is the note')).toEqual({
      ...EMPTY_MOMENT,
      note: 'This is the note'
    });
  });
});

describe('UMoment', () => {
  it('#merge', () => {
    const a = fMoment('This is the note');
    const b = fMoment('Second moment');
    a.deleteFeatures.push('yyyy');
    b.deleteFeatures.push('xxxx');
    const c = UMoment.merge(a, b);
    expect(c).toHaveProperty('deleteFeatures', ['yyyy', 'xxxx']);
  });
  it('#isEmpty', () => {
    expect(UMoment.isEmpty(fMoment('This is the note'))).toBeTruthy();
    const m = fMoment('This is the note');
    m.deleteFeatures.push('yyyy');
    expect(UMoment.isEmpty(m)).toBeFalsy();
  });
});

describe('UMomentLog', () => {
  describe('#pushMoment', () => {
    it('pushing a valid moment', () => {
      const log = new CMomentLog();
      const a = fMoment('This is the note');
      a.deleteFeatures.push('yyyy');

      const newLog = UMomentLog.pushMoment(log, a);
      expect(newLog).toHaveProperty(['undo', 'length'], 1);
      expect(newLog).toHaveProperty(['redo', 'length'], 0);

      expect(UMomentLog.hasUndo(newLog)).toBeTruthy();
      expect(UMomentLog.hasRedo(newLog)).toBeFalsy();
    });
    it('#popMoment', () => {
      const log = new CMomentLog();
      const a = fMoment('This is the note');
      a.deleteFeatures.push('yyyy');
      const logA = UMomentLog.pushMoment(log, a);
      const logB = UMomentLog.popMoment(logA, 1);
      expect(logA.undo).toHaveLength(1);
      expect(logB.undo).toEqual([]);
    });
    it('empty case', () => {
      const log = new CMomentLog();
      const a = fMoment('This is the note');

      const newLog = UMomentLog.pushMoment(log, a);
      expect(newLog).toHaveProperty(['undo', 'length'], 0);
      expect(newLog).toHaveProperty(['redo', 'length'], 0);
    });
  });
});
