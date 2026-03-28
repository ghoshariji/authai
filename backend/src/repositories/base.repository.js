const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);
    if (options.populate) query = query.populate(options.populate);
    if (options.select) query = query.select(options.select);
    return query.lean();
  }

  async findOne(filter, options = {}) {
    let query = this.model.findOne(filter);
    if (options.populate) query = query.populate(options.populate);
    if (options.select) query = query.select(options.select);
    return query.lean();
  }

  async find(filter, options = {}) {
    const sort = options.sort || { createdAt: -1 };
    let query = this.model.find(filter).sort(sort);
    if (options.populate) query = query.populate(options.populate);
    if (options.select) query = query.select(options.select);
    if (options.limit) query = query.limit(options.limit);
    return query.lean();
  }

  async findPaginated(filter, queryParams, options = {}) {
    const { page, limit, skip } = getPaginationParams(queryParams);
    const sort = options.sort || { createdAt: -1 };

    let dataQuery = this.model.find(filter).sort(sort).skip(skip).limit(limit);
    if (options.populate) dataQuery = dataQuery.populate(options.populate);
    if (options.select) dataQuery = dataQuery.select(options.select);

    const [data, total] = await Promise.all([dataQuery.lean(), this.model.countDocuments(filter)]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async create(data) {
    const doc = new this.model(data);
    return doc.save();
  }

  async createMany(dataArray) {
    return this.model.insertMany(dataArray);
  }

  async updateById(id, update, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, update, options);
  }

  async updateOne(filter, update, options = { new: true, runValidators: true }) {
    return this.model.findOneAndUpdate(filter, update, options);
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async deleteOne(filter) {
    return this.model.findOneAndDelete(filter);
  }

  async softDelete(id) {
    return this.model.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async count(filter) {
    return this.model.countDocuments(filter);
  }

  async exists(filter) {
    return this.model.exists(filter);
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}

module.exports = BaseRepository;
