import { Cycle, AcademicYear, Section, Filiere } from '../models';

export const getAcademicTree = (): Promise<Cycle[]> =>
  Cycle.findAll({
    order: [['order_display', 'ASC']],
    include: [{
      model: AcademicYear,
      as: 'years',
      include: [
        { model: Filiere, as: 'filiere', attributes: ['id', 'name', 'abbreviation', 'type'] },
        { model: Section, as: 'sections' }
      ]
    }]
  });

export const updateYear = async (id: string | number, body: Record<string, unknown>): Promise<AcademicYear | null> => {
  const year = await AcademicYear.findByPk(id);
  if (!year) return null;
  const { name, delegateName, delegatePhone, drive, documentation, order_display } = body;
  await year.update({
    ...(name !== undefined && { name }),
    ...(delegateName !== undefined && { delegateName }),
    ...(delegatePhone !== undefined && { delegatePhone }),
    ...(drive !== undefined && { drive }),
    ...(documentation !== undefined && { documentation }),
    ...(order_display !== undefined && { order_display })
  });
  return year;
};

export const updateSection = async (id: string | number, body: Record<string, unknown>): Promise<Section | null> => {
  const sec = await Section.findByPk(id);
  if (!sec) return null;
  const { name, delegateName, delegatePhone } = body;
  await sec.update({
    ...(name !== undefined && { name }),
    ...(delegateName !== undefined && { delegateName }),
    ...(delegatePhone !== undefined && { delegatePhone })
  });
  return sec;
};
