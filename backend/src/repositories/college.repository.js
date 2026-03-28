const BaseRepository = require('./base.repository');
const College = require('../models/College');

class CollegeRepository extends BaseRepository {
  constructor() {
    super(College);
  }

  async findByCode(code) {
    return College.findOne({ code: code.toUpperCase() }).lean();
  }

  async findWithSubscription(collegeId) {
    return College.findById(collegeId).populate('subscription').populate('adminUser', 'name email').lean();
  }

  async findAllPaginated(queryParams, filter = {}) {
    return this.findPaginated(filter, queryParams, {
      populate: [
        { path: 'subscription', select: 'plan status currentPeriodEnd' },
        { path: 'adminUser', select: 'name email' },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getCollegeStats(collegeId) {
    const Student = require('../models/Student');
    const Teacher = require('../models/Teacher');
    const { Subscription } = require('../models/Subscription');

    const [college, studentCount, teacherCount, subscription] = await Promise.all([
      College.findById(collegeId).lean(),
      Student.countDocuments({ collegeId, isActive: true }),
      Teacher.countDocuments({ collegeId, isActive: true }),
      Subscription.findOne({ collegeId }).lean(),
    ]);

    return {
      college,
      stats: {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        subscription: subscription || null,
      },
    };
  }
}

module.exports = new CollegeRepository();
