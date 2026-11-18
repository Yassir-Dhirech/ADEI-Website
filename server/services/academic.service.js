const { Cycle, AcademicYear, Section, Filiere } = require('../models');

const getAcademicTree = () => Cycle.findAll({
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

const updateYear = async (id, body) => {
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

const updateSection = async (id, body) => {
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

module.exports = { getAcademicTree, updateYear, updateSection };