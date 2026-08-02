sed -i -e '/<p className="text-xs text-slate-500">Read our terms of service<\/p>/a\
                </div>\
              </div>\
              <ChevronRight className="w-4 h-4 text-slate-400" />\
            </button>\
            <button \
              onClick={() => window.location.href = "?page=refund-policy"}\
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"\
            >\
              <div className="flex items-center">\
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">\
                  <FileText className="w-4 h-4 text-slate-500" />\
                </div>\
                <div className="text-left">\
                  <p className="text-sm font-semibold text-slate-800">Payment & Refund Policy</p>\
                  <p className="text-xs text-slate-500">Read our refund and cancellation policies</p>' ./src/pages/Profile.tsx
