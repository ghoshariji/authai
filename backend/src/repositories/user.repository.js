const BaseRepository = require('./base.repository');
const { User } = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, includePassword = false) {
    let query = User.findOne({ email });
    if (includePassword) query = query.select('+password +refreshToken');
    return query.lean();
  }

  async findByCollegeId(collegeId, role = null) {
    const filter = { collegeId };
    if (role) filter.role = role;
    return User.find(filter).lean();
  }

  async updateRefreshToken(userId, refreshToken) {
    return User.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  }

  async updateLastLogin(userId) {
    return User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  async deactivateUser(userId) {
    return User.findByIdAndUpdate(userId, { isActive: false, refreshToken: null }, { new: true });
  }

  async countByCollege(collegeId) {
    return User.countDocuments({ collegeId, isActive: true });
  }
}

module.exports = new UserRepository();
