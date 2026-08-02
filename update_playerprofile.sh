sed -i 's/const { user: currentUser } = useAuth();/const { user: currentUser, isPro, isAdmin } = useAuth();/g' ./src/pages/PlayerProfile.tsx

# Replace {loading ? ( with the isPro check
sed -i -e '/{loading ? (/c\
            {!(isPro || isAdmin) ? (\
              <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl border border-slate-100">\
                <Trophy className="w-10 h-10 text-slate-300 mb-3" />\
                <h2 className="text-xl font-bold text-slate-800 mb-2">Advanced Statistics Locked</h2>\
                <p className="text-slate-500 text-sm mb-4 max-w-sm">Upgrade to PRO to unlock advanced career stats, performance insights, and historical tracking for all players.</p>\
                <button \
                  onClick={() => window.dispatchEvent(new CustomEvent('"'"'openProModal'"'"', { detail: '"'"'Career Stats'"'"' }))} \
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full transition-colors text-sm shadow-md shadow-indigo-200"\
                >\
                  Unlock Pro\
                </button>\
              </div>\
            ) : loading ? (' ./src/pages/PlayerProfile.tsx
