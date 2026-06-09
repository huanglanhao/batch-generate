!macro closeRunningApplicationForm
  DetailPrint "正在检查并关闭运行中的统一申请书生成器..."
  nsExec::ExecToStack 'taskkill /IM "统一申请书生成器.exe"'
  Pop $0
  Pop $1
  Sleep 1200
  nsExec::ExecToStack 'taskkill /F /IM "统一申请书生成器.exe"'
  Pop $0
  Pop $1
  Sleep 500
!macroend

!macro preInit
  !insertmacro closeRunningApplicationForm
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$PROGRAMFILES64\pdd-application-form"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$PROGRAMFILES64\pdd-application-form"
  SetRegView 32
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$PROGRAMFILES\pdd-application-form"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$PROGRAMFILES\pdd-application-form"
!macroend

!macro customUnInit
  !insertmacro closeRunningApplicationForm
!macroend
