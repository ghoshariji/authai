const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained is required'],
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: 1,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['PASS', 'FAIL', 'ABSENT'],
      required: [true, 'Status is required'],
    },
    remarks: {
      type: String,
      trim: true,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ collegeId: 1, student: 1 });
resultSchema.index({ collegeId: 1, exam: 1 });
resultSchema.index({ student: 1, exam: 1, subject: 1 }, { unique: true });

resultSchema.pre('save', function (next) {
  if (this.marksObtained !== undefined && this.totalMarks) {
    this.percentage = Math.round((this.marksObtained / this.totalMarks) * 100 * 100) / 100;
    this.grade = calculateGrade(this.percentage);
  }
  next();
});

function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

const Result = mongoose.model('Result', resultSchema);

module.exports = { Result, calculateGrade };
