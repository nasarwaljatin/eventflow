const fs = require('fs');

let content = fs.readFileSync('src/controllers/registration.controller.ts', 'utf8');

// 1. Add import
if (!content.includes('checkAndTriggerAlert')) {
  content = content.replace(
    "import { AppError } from '../middleware/errorHandler.js';",
    "import { AppError } from '../middleware/errorHandler.js';\nimport { checkAndTriggerAlert } from '../lib/alerts.js';"
  );
}

// 2. update createRegistration
if (!content.includes("action: 'created'")) {
  content = content.replace(
    `      // 4. Create the registration\n      return await tx.registration.create({\n        data: {\n          sessionId,\n          attendeeName,\n          attendeeEmail,\n          status: 'reserved',\n          createdById\n        }\n      });\n    });\n\n    res.status(201).json({`,
    `      // 4. Create the registration and audit log\n      const newReg = await tx.registration.create({\n        data: {\n          sessionId,\n          attendeeName,\n          attendeeEmail,\n          status: 'reserved',\n          createdById\n        }\n      });\n\n      await tx.auditLog.create({\n        data: {\n          registrationId: newReg.id,\n          action: 'created',\n          oldStatus: null,\n          newStatus: 'reserved',\n          performedById: createdById || null\n        }\n      });\n\n      return newReg;\n    });\n\n    await checkAndTriggerAlert(sessionId);\n\n    res.status(201).json({`
  );
}

// 3. updateRegistrationStatus
if (!content.includes("action: 'status_changed'")) {
  content = content.replace(
    `        return await tx.registration.update({\n          where: { id },\n          data: updates\n        });\n      });\n\n      res.json({`,
    `        const updatedReg = await tx.registration.update({\n          where: { id },\n          data: updates\n        });\n\n        const performedById = (req as any).user?.id || (req as any).user?.userId || null;\n        \n        await tx.auditLog.create({\n          data: {\n            registrationId: id,\n            action: 'status_changed',\n            oldStatus: reg.status,\n            newStatus: updates.status,\n            performedById\n          }\n        });\n\n        return updatedReg;\n      });\n\n      const reg = await prisma.registration.findUnique({ where: { id } });\n      if (reg) await checkAndTriggerAlert(reg.sessionId);\n\n      res.json({`
  );
}

// 4. importRegistrations
if (content.includes(`createdById: req.user?.userId\n            }\n          });\n        });\n        \n        results.push({ row: rowNumber, status: 'created', registrationId: registration.id, data: row });`)) {
  content = content.replace(
    `createdById: req.user?.userId\n            }\n          });\n        });\n        \n        results.push({ row: rowNumber, status: 'created', registrationId: registration.id, data: row });`,
    `createdById: (req as any).user?.userId || null\n            }\n          });\n\n          await tx.auditLog.create({\n            data: {\n              registrationId: newReg.id,\n              action: 'created',\n              oldStatus: null,\n              newStatus: 'reserved',\n              performedById: (req as any).user?.userId || null\n            }\n          });\n\n          return newReg;\n        });\n        \n        await checkAndTriggerAlert(sessionId);\n\n        results.push({ row: rowNumber, status: 'created', registrationId: registration.id, data: row });`
  ).replace(
    `return await tx.registration.create({`,
    `const newReg = await tx.registration.create({`
  );
}

// 5. add staff note and get timeline
if (!content.includes('addStaffNote')) {
  content += `\n
export const addStaffNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const user = req.user!;

    if (!note) {
      throw new AppError('Note content is required', 400);
    }

    const reg = await prisma.registration.findUnique({ where: { id } });
    if (!reg) {
      throw new AppError('Registration not found', 404);
    }

    const newNote = await prisma.auditLog.create({
      data: {
        registrationId: id,
        action: 'note_added',
        note,
        performedById: user.userId
      }
    });

    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    next(error);
  }
};

export const getTimeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const logs = await prisma.auditLog.findMany({
      where: { registrationId: id },
      include: {
        performedBy: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { performedAt: 'desc' }
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
`;
}

fs.writeFileSync('src/controllers/registration.controller.ts', content);
