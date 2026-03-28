require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { User, ROLES } = require('../src/models/User');
const College = require('../src/models/College');
const { Subscription, PLANS, PLAN_LIMITS, SUBSCRIPTION_STATUS } = require('../src/models/Subscription');
const Department = require('../src/models/Department');
const Class = require('../src/models/Class');
const Teacher = require('../src/models/Teacher');
const Student = require('../src/models/Student');
const Subject = require('../src/models/Subject');
const logger = require('../src/utils/logger');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_management';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      College.deleteMany({}),
      Subscription.deleteMany({}),
      Department.deleteMany({}),
      Class.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Subject.deleteMany({}),
    ]);
    logger.info('Cleared existing data');

    // ============ SUPER ADMIN ============
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@platform.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
      role: ROLES.SUPER_ADMIN,
      isActive: true,
    });
    logger.info(`Created super admin: ${superAdmin.email}`);

    // ============ COLLEGE A — Alpha University (PRO) ============
    const adminA = await User.create({
      name: 'Dr. Alice Johnson',
      email: 'admin@alpha.edu',
      password: 'Admin@123',
      role: ROLES.COLLEGE_ADMIN,
    });

    const collegeA = await College.create({
      name: 'Alpha University',
      code: 'ALPHA',
      email: 'info@alpha.edu',
      phone: '+1-555-0101',
      address: { street: '100 Alpha Ave', city: 'Boston', state: 'MA', country: 'USA', pincode: '02101' },
      website: 'https://alpha.edu',
      adminUser: adminA._id,
    });
    collegeA.collegeId = collegeA._id;
    await collegeA.save();

    adminA.collegeId = collegeA._id;
    await adminA.save();

    const subA = await Subscription.create({
      collegeId: collegeA._id,
      plan: PLANS.PRO,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      limits: PLAN_LIMITS.PRO,
      billingCycle: 'MONTHLY',
      amount: 99,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    collegeA.subscription = subA._id;
    await collegeA.save();

    // ============ COLLEGE B — Beta College (BASIC) ============
    const adminB = await User.create({
      name: 'Prof. Bob Smith',
      email: 'admin@beta.edu',
      password: 'Admin@123',
      role: ROLES.COLLEGE_ADMIN,
    });

    const collegeB = await College.create({
      name: 'Beta College',
      code: 'BETA',
      email: 'info@beta.edu',
      phone: '+1-555-0202',
      address: { street: '200 Beta Blvd', city: 'Chicago', state: 'IL', country: 'USA', pincode: '60601' },
      website: 'https://beta.edu',
      adminUser: adminB._id,
    });
    collegeB.collegeId = collegeB._id;
    await collegeB.save();

    adminB.collegeId = collegeB._id;
    await adminB.save();

    const subB = await Subscription.create({
      collegeId: collegeB._id,
      plan: PLANS.BASIC,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      limits: PLAN_LIMITS.BASIC,
      billingCycle: 'YEARLY',
      amount: 290,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    collegeB.subscription = subB._id;
    await collegeB.save();

    logger.info('Created 2 colleges with subscriptions');

    // ============ DEPARTMENTS — College A ============
    const [deptCSA, deptMathA] = await Department.insertMany([
      { name: 'Computer Science', code: 'CS', description: 'CS Dept', collegeId: collegeA._id },
      { name: 'Mathematics', code: 'MATH', description: 'Math Dept', collegeId: collegeA._id },
    ]);

    // ============ DEPARTMENTS — College B ============
    const [deptCSB, deptEngB] = await Department.insertMany([
      { name: 'Computer Science', code: 'CS', description: 'CS Dept', collegeId: collegeB._id },
      { name: 'Engineering', code: 'ENG', description: 'Eng Dept', collegeId: collegeB._id },
    ]);

    logger.info('Created departments');

    // ============ CLASSES — College A ============
    const [classA1, classA2] = await Class.insertMany([
      { name: 'BSc CS Year 1', section: 'A', year: 1, semester: 1, department: deptCSA._id, collegeId: collegeA._id },
      { name: 'BSc CS Year 2', section: 'B', year: 2, semester: 3, department: deptCSA._id, collegeId: collegeA._id },
    ]);

    // ============ CLASSES — College B ============
    const [classB1, classB2] = await Class.insertMany([
      { name: 'BSc CS Year 1', section: 'A', year: 1, semester: 1, department: deptCSB._id, collegeId: collegeB._id },
      { name: 'BEng Year 1', section: 'A', year: 1, semester: 1, department: deptEngB._id, collegeId: collegeB._id },
    ]);

    logger.info('Created classes');

    // ============ TEACHERS — College A ============
    const teacherUserA1 = await User.create({
      name: 'Prof. Carol White', email: 'carol@alpha.edu', password: 'Teacher@123',
      role: ROLES.TEACHER, collegeId: collegeA._id,
    });
    const teacherUserA2 = await User.create({
      name: 'Dr. David Brown', email: 'david@alpha.edu', password: 'Teacher@123',
      role: ROLES.TEACHER, collegeId: collegeA._id,
    });

    const teacherA1 = await Teacher.create({
      userId: teacherUserA1._id, teacherId: 'TCH-A-001', collegeId: collegeA._id,
      department: deptCSA._id, qualification: 'PhD Computer Science',
      experience: 8, employeeId: 'EMP-A-001', designation: 'Associate Professor',
    });
    const teacherA2 = await Teacher.create({
      userId: teacherUserA2._id, teacherId: 'TCH-A-002', collegeId: collegeA._id,
      department: deptCSA._id, qualification: 'PhD Mathematics',
      experience: 5, employeeId: 'EMP-A-002', designation: 'Assistant Professor',
    });

    // ============ TEACHERS — College B ============
    const teacherUserB1 = await User.create({
      name: 'Prof. Eve Davis', email: 'eve@beta.edu', password: 'Teacher@123',
      role: ROLES.TEACHER, collegeId: collegeB._id,
    });

    const teacherB1 = await Teacher.create({
      userId: teacherUserB1._id, teacherId: 'TCH-B-001', collegeId: collegeB._id,
      department: deptCSB._id, qualification: 'MSc Computer Science',
      experience: 3, employeeId: 'EMP-B-001', designation: 'Lecturer',
    });

    logger.info('Created teachers');

    // ============ SUBJECTS — College A ============
    const [subjectA1, subjectA2] = await Subject.insertMany([
      {
        name: 'Introduction to Programming', code: 'CS101',
        department: deptCSA._id, class: classA1._id, teacher: teacherA1._id,
        collegeId: collegeA._id, credits: 4,
      },
      {
        name: 'Data Structures', code: 'CS201',
        department: deptCSA._id, class: classA2._id, teacher: teacherA1._id,
        collegeId: collegeA._id, credits: 3,
      },
    ]);

    // ============ SUBJECTS — College B ============
    const [subjectB1] = await Subject.insertMany([
      {
        name: 'Programming Fundamentals', code: 'CS101',
        department: deptCSB._id, class: classB1._id, teacher: teacherB1._id,
        collegeId: collegeB._id, credits: 3,
      },
    ]);

    // Add subjects to teachers
    await Teacher.findByIdAndUpdate(teacherA1._id, { subjects: [subjectA1._id, subjectA2._id] });
    await Teacher.findByIdAndUpdate(teacherB1._id, { subjects: [subjectB1._id] });

    logger.info('Created subjects');

    // ============ STUDENTS — College A ============
    const studentUsers_A = await Promise.all([
      User.create({ name: 'Alice Green', email: 'alice@alpha.edu', password: 'Student@123', role: ROLES.STUDENT, collegeId: collegeA._id }),
      User.create({ name: 'Bob Turner', email: 'bob@alpha.edu', password: 'Student@123', role: ROLES.STUDENT, collegeId: collegeA._id }),
      User.create({ name: 'Carol King', email: 'carolking@alpha.edu', password: 'Student@123', role: ROLES.STUDENT, collegeId: collegeA._id }),
    ]);

    await Student.insertMany([
      {
        userId: studentUsers_A[0]._id, studentId: 'STU-A-001', collegeId: collegeA._id,
        department: deptCSA._id, class: classA1._id, year: 1, semester: 1,
        rollNumber: 'A001', gender: 'FEMALE', dob: new Date('2003-05-15'),
      },
      {
        userId: studentUsers_A[1]._id, studentId: 'STU-A-002', collegeId: collegeA._id,
        department: deptCSA._id, class: classA1._id, year: 1, semester: 1,
        rollNumber: 'A002', gender: 'MALE', dob: new Date('2003-08-22'),
      },
      {
        userId: studentUsers_A[2]._id, studentId: 'STU-A-003', collegeId: collegeA._id,
        department: deptCSA._id, class: classA2._id, year: 2, semester: 3,
        rollNumber: 'A003', gender: 'FEMALE', dob: new Date('2002-11-10'),
      },
    ]);

    // ============ STUDENTS — College B ============
    const studentUsers_B = await Promise.all([
      User.create({ name: 'David Lee', email: 'david@beta.edu', password: 'Student@123', role: ROLES.STUDENT, collegeId: collegeB._id }),
      User.create({ name: 'Emma Wilson', email: 'emma@beta.edu', password: 'Student@123', role: ROLES.STUDENT, collegeId: collegeB._id }),
    ]);

    await Student.insertMany([
      {
        userId: studentUsers_B[0]._id, studentId: 'STU-B-001', collegeId: collegeB._id,
        department: deptCSB._id, class: classB1._id, year: 1, semester: 1,
        rollNumber: 'B001', gender: 'MALE', dob: new Date('2004-03-20'),
      },
      {
        userId: studentUsers_B[1]._id, studentId: 'STU-B-002', collegeId: collegeB._id,
        department: deptCSB._id, class: classB1._id, year: 1, semester: 1,
        rollNumber: 'B002', gender: 'FEMALE', dob: new Date('2004-07-14'),
      },
    ]);

    logger.info('Created students');

    // ============ Update class strength ============
    await Promise.all([
      Class.findByIdAndUpdate(classA1._id, { strength: 2 }),
      Class.findByIdAndUpdate(classA2._id, { strength: 1 }),
      Class.findByIdAndUpdate(classB1._id, { strength: 2 }),
    ]);

    console.log('\n=== SEED COMPLETE ===');
    console.log('Super Admin:', process.env.SUPER_ADMIN_EMAIL || 'superadmin@platform.com', '/ SuperAdmin@123');
    console.log('Alpha University Admin: admin@alpha.edu / Admin@123');
    console.log('Beta College Admin: admin@beta.edu / Admin@123');
    console.log('College A Teachers: carol@alpha.edu, david@alpha.edu / Teacher@123');
    console.log('College B Teacher: eve@beta.edu / Teacher@123');
    console.log('College A Students: alice@alpha.edu, bob@alpha.edu, carolking@alpha.edu / Student@123');
    console.log('College B Students: david@beta.edu, emma@beta.edu / Student@123');
    console.log('====================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
